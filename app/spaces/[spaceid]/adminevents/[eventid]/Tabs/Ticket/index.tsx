import React, { useState } from 'react';
import { Stack, Box, Typography } from '@mui/material';
import {
  TicketHeader,
  InitialSetup,
  TicketSetup,
  CreateTicket,
  TicketCreationSummary,
  ProcessingTicket,
  TicketVault,
  RegistrationPanel,
  NoTicketList,
  ZupassList,
  ScrollPassList,
  PGFList,
} from './components';
import { ZuButton } from 'components/core';
import { scroll, scrollSepolia } from 'viem/chains';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { TICKET_FACTORY_ABI } from '@/utils/ticket_factory_abi';
import { client, config } from '@/context/WalletContext';
import {
  TICKET_FACTORY_ADDRESS,
  mUSDC_TOKEN,
  mUSDT_TOKEN,
  isDev,
} from '@/constant';
import { Address, parseUnits } from 'viem';
import dayjs, { Dayjs } from 'dayjs';
import { convertDateToEpoch } from '@/utils/format';
import { TICKET_ABI } from '@/utils/ticket_abi';
import { ERC20_ABI } from '@/utils/erc20_abi';
import { TICKET_WITH_WHITELIST_ABI } from '@/utils/ticket_with_whitelist_abi';
import { useEffect } from 'react';
import { Event } from '@/types';
import { Abi, AbiItem } from 'viem';
import { TicketType } from './components/CreateTicket';
import { SelectedFile } from '@lxdao/uploader3';
import { updateTicketContract } from '@/services/event/addTicketContract';
import Dialog from '@/app/spaces/components/Modal/Dialog';
import useOpenDraw from '@/hooks/useOpenDraw';
import Drawer from '@/components/drawer';
import { TicketingMethod } from './components/types';
import { useQueryClient } from '@tanstack/react-query';
import FormHeader from '@/components/form/FormHeader';

interface PropTypes {
  event?: Event;
}

const Ticket = ({ event }: PropTypes) => {
  const { open, handleOpen, handleClose } = useOpenDraw();

  const [ticketInfo, setTicketInfo] = useState<any>({});
  const [isTicketFree, setIsTicketFree] = useState(false);
  const [isShowQtyRemaining, setIsShowQtyRemaining] = useState(false);
  const [isHideUntilSetDate, setIsHideUntilSetDate] = useState(false);
  const [isHideAfterSetDate, setIsHideAfterSetDate] = useState(false);
  const [isMintCloseTime, setIsMintCloseTime] = useState(false);
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());
  const [endTime, setEndTime] = useState<Dayjs>(dayjs());
  const [isHideWhenSoldOut, setIsHideWhenSoldOut] = useState(false);
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [selectedType, setSelectedType] = useState('Attendee');
  const [isWhiteList, setIsWhiteList] = useState(true);
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setTicketInfo({
      ...ticketInfo,
      [name]: value,
    });
  };

  const [isConfirm, setIsConfirm] = useState(false);
  const [isNext, setIsNext] = useState(false);
  const [isTicket, setIsTicket] = useState(false);
  const [createTicketStep, setCreateTicketStep] = useState(0);
  const [goToSummary, setGoToSummary] = useState(false);
  const [purchasingTicket, setPurchasingTicket] = useState(false);
  const [toggleAction, setToggleAction] = useState('CreateTicket');
  const [txnHash, setTxnHash] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ticketImage, setTicketImage] = useState<SelectedFile>();
  const [ticketImageURL, setTicketImageURL] = useState<string>();
  const [ticketMintDeadline, setTicketMintDeadline] = useState<Dayjs | null>(
    dayjs(),
  );
  const [vaultIndex, setVaultIndex] = useState<number>(0);
  const [blockClickModal, setBlockClickModal] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (event: { target: { files: any[] } }) => {
    const file = event.target.files[0];
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];

    if (
      file &&
      allowedExtensions.includes(file.name.split('.').pop().toLowerCase())
    ) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewImage(null);
    }
  };

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tickets, setTickets] = useState<Array<any>>([]);
  const [ticketAddresses, setTicketAddresses] = useState<Array<string>>([]);
  const initialWhitelist = ['0x0000000000000000000000000000000000000000'];

  const regAndAccess = event?.regAndAccess?.edges?.[0]?.node;
  const queryClient = useQueryClient();

  const updateEventContract = async (
    type: string,
    contractAddress: string,
    description: string,
    image_url: string,
    status: string,
    name: string,
    price: number,
    tokenType: string,
    disclaimer: string,
  ) => {
    const addTicketContractInput = {
      eventId: event?.id as string,
      type: type,
      contractAddress: contractAddress,
      description: description,
      image_url: image_url,
      status: status,
      id: regAndAccess?.id,
      name: name,
      price: price,
      tokenType: tokenType,
      disclaimer: disclaimer,
    };
    try {
      setBlockClickModal(true);
      console.log(addTicketContractInput);
      const response = await updateTicketContract(addTicketContractInput);
      if (response.status === 200) {
        setShowModal(true);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setBlockClickModal(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      setIsSubmitLoading(true);
      setPurchasingTicket(true);
      setGoToSummary(false);

      let ticketMintClose: Dayjs;
      if (isMintCloseTime) {
        endDate.hour(endTime.hour());
        endDate.minute(endTime.minute());
        endDate.second(endTime.second());
        endDate.millisecond(endTime.millisecond());
        ticketMintClose = endDate;
      } else {
        const eventEndTime = dayjs(event?.endTime, 'YYYY-MM-DD HH:mm:ss');
        ticketMintClose = eventEndTime.subtract(1, 'minute');
      }

      const decimal = (await client.readContract({
        address:
          selectedToken === 'USDT' ? mUSDT_TOKEN : (mUSDC_TOKEN as Address),
        abi: ERC20_ABI,
        functionName: 'decimals',
      })) as number;

      const createTicketHash = await writeContract(config, {
        chainId: isDev ? scrollSepolia.id : scroll.id,
        address: TICKET_FACTORY_ADDRESS as Address,
        abi: TICKET_FACTORY_ABI,
        functionName: 'createNewTicket',
        args: isWhiteList
          ? [
              regAndAccess?.scrollPassContractFactoryID,
              ticketInfo?.ticketName,
              selectedToken === 'USDT' ? mUSDT_TOKEN : mUSDC_TOKEN,
              convertDateToEpoch(ticketMintClose),
              isTicketFree
                ? 0
                : parseUnits(String(ticketInfo?.ticketPrice), decimal),
              true,
              initialWhitelist,
            ]
          : [
              regAndAccess?.scrollPassContractFactoryID,
              ticketInfo?.ticketName,
              selectedToken === 'USDT' ? mUSDT_TOKEN : mUSDC_TOKEN,
              convertDateToEpoch(ticketMintClose),
              isTicketFree
                ? 0
                : parseUnits(String(ticketInfo?.ticketPrice), decimal),
              false,
              [],
            ],
      });
      setTxnHash(createTicketHash);

      const { status: createTicketStatus, logs: createTicketLogs } =
        await waitForTransactionReceipt(config, {
          hash: createTicketHash,
          timeout: 6000_000,
        });

      if (createTicketStatus === 'success') {
        const previewImageToUse = ticketImageURL ?? '';

        if (createTicketLogs.length > 0) {
          const newContractAddress = createTicketLogs[0].address;
          await updateEventContract(
            selectedType,
            newContractAddress?.toString(),
            ticketInfo?.description,
            previewImageToUse,
            ticketInfo?.startingStatus,
            ticketInfo?.ticketName,
            isTicketFree ? 0 : Number(ticketInfo?.ticketPrice),
            selectedToken,
            ticketInfo?.message,
          );
          setCreateTicketStep(3);
        }
      }
      queryClient.invalidateQueries({
        queryKey: ['fetchEventById'],
      });
      await readFromContract();
      setIsSubmitLoading(false);
    } catch (error) {
      console.log(error);
      setIsSubmitLoading(false);
    }
  };

  const readFromContract = async () => {
    if (!regAndAccess?.scrollPassContractFactoryID) return;
    try {
      setIsLoading(true);

      const getTicketAddresses = (await client.readContract({
        address: TICKET_FACTORY_ADDRESS as Address,
        abi: TICKET_FACTORY_ABI as Abi,
        functionName: 'getTickets',
        args: [regAndAccess?.scrollPassContractFactoryID],
      })) as Array<string>;

      setTicketAddresses(getTicketAddresses);

      if (getTicketAddresses?.length > 0) {
        let results = [];
        for (let i = 0; i < getTicketAddresses.length; i++) {
          const ticketAddress = getTicketAddresses[i] as Address;
          let isWhitelistTicket = false;

          try {
            await client.readContract({
              address: ticketAddress,
              abi: TICKET_WITH_WHITELIST_ABI as Abi,
              functionName: 'whitelist',
              args: ['0x0000000000000000000000000000000000000000'],
            });
            isWhitelistTicket = true;
          } catch (e) {
            isWhitelistTicket = false;
          }

          const ticketABI: AbiItem[] = isWhitelistTicket
            ? (TICKET_WITH_WHITELIST_ABI as AbiItem[])
            : (TICKET_ABI as AbiItem[]);

          const ticketContract = {
            address: ticketAddress,
            abi: ticketABI,
          } as const;

          const multicallContracts = [
            {
              ...ticketContract,
              functionName: 'name',
            },
            {
              ...ticketContract,
              functionName: 'symbol',
            },
            {
              ...ticketContract,
              functionName: 'paymentToken',
            },
            {
              ...ticketContract,
              functionName: 'ticketPrice',
            },
            {
              ...ticketContract,
              functionName: 'totalTicketsMinted',
            },
            {
              ...ticketContract,
              functionName: 'eventTime',
            },
            {
              ...ticketContract,
              functionName: 'ticketMintCloseTime',
            },
            {
              ...ticketContract,
              functionName: 'owner',
            },
          ];

          if (isWhitelistTicket) {
            multicallContracts.push(
              {
                ...ticketContract,
                functionName: 'whitelist',
                args: ['0x0000000000000000000000000000000000000000'] as const,
              } as any,
              {
                ...ticketContract,
                functionName: 'getWhitelistAddresses',
              } as any,
            );
          }

          const result = await client.multicall({
            contracts: multicallContracts,
          });
          results.push(result);
        }
        setTickets(results);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    }
  };
  useEffect(() => {
    readFromContract();
  }, []);

  const handleCreateTicketFormClose = () => {
    handleClose();
    setCreateTicketStep(0);
  };

  const handleCreateTicketFormNext = (isNext: boolean) => {
    setCreateTicketStep((prev) => (isNext ? prev + 1 : prev - 1));
  };

  const list = () => (
    <Box
      sx={{
        width: '700px',
        backgroundColor: '#222222',
      }}
      role="presentation"
      zIndex="100"
    >
      <FormHeader
        handleClose={handleCreateTicketFormClose}
        title="Create Ticket"
      />

      {createTicketStep === 0 && (
        <TicketSetup
          handleClose={handleCreateTicketFormClose}
          handleNext={() => handleCreateTicketFormNext(true)}
          setSelectedToken={setSelectedToken}
          selectedToken={selectedToken}
        />
      )}
      {createTicketStep === 1 && (
        <CreateTicket
          selectedToken={selectedToken}
          isTicketFree={isTicketFree}
          setIsTicketFree={setIsTicketFree}
          isShowQtyRemaining={isShowQtyRemaining}
          setIsShowQtyRemaining={setIsShowQtyRemaining}
          isHideUntilSetDate={isHideUntilSetDate}
          setIsHideUntilSetDate={setIsHideUntilSetDate}
          isHideAfterSetDate={isHideAfterSetDate}
          setIsHideAfterSetDate={setIsHideAfterSetDate}
          isHideWhenSoldOut={isHideWhenSoldOut}
          setIsHideWhenSoldOut={setIsHideWhenSoldOut}
          isWhiteList={isWhiteList}
          setIsWhiteList={setIsWhiteList}
          handleChange={handleChange}
          setIsConfirm={setIsConfirm}
          setGoToSummary={setGoToSummary}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          previewImage={previewImage}
          setPreviewImage={setPreviewImage}
          handleFileChange={handleFileChange}
          ticketMintDeadline={ticketMintDeadline}
          setTicketMintDeadline={setTicketMintDeadline}
          isMintCloseTime={isMintCloseTime}
          setIsMintCloseTime={setIsMintCloseTime}
          endDate={endDate}
          setEndDate={setEndDate}
          endTime={endTime}
          setEndTime={setEndTime}
          ticketImage={ticketImage}
          setTicketImage={setTicketImage}
          ticketImageURL={ticketImageURL}
          setTicketImageURL={setTicketImageURL}
          handleNext={() => handleCreateTicketFormNext(true)}
          handleBack={() => handleCreateTicketFormNext(false)}
        />
      )}
      {createTicketStep === 2 && (
        <TicketCreationSummary
          handleSubmit={handleSubmit}
          isTicketFree={isTicketFree}
          selectedToken={selectedToken}
          isWhiteList={isWhiteList}
          ticketInfo={ticketInfo}
          setIsConfirm={setIsConfirm}
          ticketImageURL={ticketImageURL}
          setPurchasingTicket={setPurchasingTicket}
          setGoToSummary={setGoToSummary}
          isSubmitLoading={isSubmitLoading}
          handleBack={() => handleCreateTicketFormNext(false)}
        />
      )}
      {createTicketStep === 3 && (
        <ProcessingTicket
          setPurchasingTicket={setPurchasingTicket}
          toggleDrawer={handleCreateTicketFormClose}
          isSubmitLoading={isSubmitLoading}
          txnHash={txnHash}
        />
      )}
    </Box>
  );
  const vault = () => (
    <Box
      sx={{
        maxWidth: '700px',
        backgroundColor: '#222222',
      }}
      role="presentation"
      zIndex="100"
    >
      <FormHeader handleClose={handleClose} title="Edit Ticket" />
      <TicketVault
        vaultIndex={vaultIndex}
        ticketAddresses={ticketAddresses}
        tickets={tickets}
        refetch={readFromContract}
        setBlockClickModal={setBlockClickModal}
        eventContracts={
          event?.regAndAccess?.edges?.[0]?.node.scrollPassTickets
            ? event?.regAndAccess?.edges?.[0]?.node.scrollPassTickets
            : []
        }
        onClose={handleClose}
        event={event as Event}
      />
    </Box>
  );

  return (
    <Stack direction="column" spacing={4} padding="0 30px 30px">
      <Dialog
        title="Created"
        message="Your new NFT ticket is created."
        showModal={showModal}
        onClose={() => {
          setShowModal(false);
        }}
        onConfirm={() => {
          setShowModal(false);
        }}
      />
      <Dialog
        showModal={blockClickModal}
        showActions={false}
        title="Updating"
        message="Please wait while the data is being updated..."
      />
      {<TicketHeader regAndAccess={regAndAccess} />}
      {!regAndAccess && <RegistrationPanel registered={false} />}
      {regAndAccess?.ticketType === TicketingMethod.NoTicketing && (
        <NoTicketList regAndAccess={regAndAccess} />
      )}
      {regAndAccess?.ticketType === TicketingMethod.LottoPGF && (
        <PGFList regAndAccess={regAndAccess} />
      )}
      {regAndAccess?.ticketType === TicketingMethod.ZuPass && (
        <ZupassList regAndAccess={regAndAccess} />
      )}
      {regAndAccess?.ticketType === TicketingMethod.ScrollPass && (
        <ScrollPassList
          ticketsIsLoading={isLoading}
          regAndAccess={regAndAccess}
          setVaultIndex={setVaultIndex}
          ticketAddresses={ticketAddresses}
          tickets={tickets}
          setToggleAction={setToggleAction}
          onToggle={handleOpen}
          event={event!}
          eventContracts={
            event?.regAndAccess?.edges?.[0]?.node.scrollPassTickets
              ? event?.regAndAccess?.edges?.[0]?.node.scrollPassTickets
              : []
          }
        />
      )}
      {/* <TicketAccess /> */}
      <Drawer open={open} onOpen={handleOpen} onClose={handleClose}>
        {toggleAction === 'CreateTicket'
          ? list()
          : toggleAction === 'ViewVault'
            ? vault()
            : null}
      </Drawer>
    </Stack>
  );
};

export default Ticket;
