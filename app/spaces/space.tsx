'use client';
import { useState, useEffect } from 'react';
import {
  Stack,
  Grid,
  useTheme,
  useMediaQuery,
  OutlinedInput,
  InputAdornment,
  Typography,
} from '@mui/material';
import { Sidebar } from 'components/layout';
import { SpaceHeader } from './components';
import { SpaceCard } from '@/components/cards';
import { useCeramicContext } from '@/context/CeramicContext';
import SidebarLeft from './components/Sidebar';
import { SearchIcon } from '@/components/icons';
import { ZuSelect } from '@/components/core';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Space, SpaceData } from '@/types';
import { SpaceCardSkeleton } from '@/components/cards/SpaceCard';
import { isDev, prodShowSpaceId } from '@/constant';
import { getSpacesQuery } from '@/services/space';

const Home = () => {
  const theme = useTheme();
  const [selected, setSelected] = useState('Spaces');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchVal, setSearchVal] = useState('');
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const { composeClient } = useCeramicContext();

  const getSpaces = async () => {
    try {
      const response: any = await composeClient.executeQuery(getSpacesQuery);

      if ('zucitySpaceIndex' in response.data) {
        const spaceData: SpaceData = response.data as SpaceData;
        let fetchedSpaces: Space[] = spaceData.zucitySpaceIndex.edges.map(
          (edge) => edge.node,
        );
        setSpaces(fetchedSpaces);
      } else {
        console.error('Invalid data structure:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    }
  };

  useEffect(() => {
    getSpaces().catch((error) => {
      console.error('An error occurred:', error);
    });
  }, []);

  return (
    <Stack
      direction="row"
      sx={{ backgroundColor: '#222222' }}
      minHeight="100vh"
    >
      {!isTablet && <Sidebar selected={selected} />}
      <Stack direction="column" borderLeft="1px solid #383838" flex={1}>
        <SpaceHeader />
        {/*<Stack*/}
        {/*  sx={{*/}
        {/*    display: 'none',*/}
        {/*    flexDirection: 'column',*/}
        {/*    gap: '10px',*/}
        {/*    [theme.breakpoints.down('md')]: {*/}
        {/*      display: 'flex',*/}
        {/*    },*/}
        {/*    padding: '20px',*/}
        {/*  }}*/}
        {/*>*/}
        {/*  <OutlinedInput*/}
        {/*    placeholder="Search Events"*/}
        {/*    sx={{*/}
        {/*      backgroundColor:*/}
        {/*        'var(--Inactive-White, rgba(255, 255, 255, 0.05))',*/}
        {/*      paddingX: '15px',*/}
        {/*      paddingY: '13px',*/}
        {/*      borderRadius: '10px',*/}
        {/*      height: '35px',*/}
        {/*      border: '1px solid var(--Hover-White, rgba(255, 255, 255, 0.10))',*/}
        {/*      fontFamily: 'Inter',*/}
        {/*      opacity: 0.7,*/}
        {/*      color: 'white',*/}
        {/*      '& .MuiOutlinedInput-notchedOutline': {*/}
        {/*        border: 'none',*/}
        {/*      },*/}
        {/*    }}*/}
        {/*    onChange={(e) => setSearchVal(e.target.value)}*/}
        {/*    startAdornment={*/}
        {/*      <InputAdornment position="start" sx={{ opacity: 0.6 }}>*/}
        {/*        <SearchIcon />*/}
        {/*      </InputAdornment>*/}
        {/*    }*/}
        {/*  />*/}
        {/*  <Stack*/}
        {/*    sx={{*/}
        {/*      padding: '10px',*/}
        {/*      borderBottom: '1px solid rgba(255, 255, 255, 0.10)',*/}
        {/*    }}*/}
        {/*  >*/}
        {/*    <Typography*/}
        {/*      fontSize={'18px'}*/}
        {/*      fontWeight={'700'}*/}
        {/*      lineHeight={'120%'}*/}
        {/*      color={'white'}*/}
        {/*    >*/}
        {/*      Sort & Filter Spaces*/}
        {/*    </Typography>*/}
        {/*  </Stack>*/}
        {/*  <ZuSelect*/}
        {/*    sx={{*/}
        {/*      backgroundColor: 'rgba(255, 255, 255, 0.05)',*/}
        {/*      opacity: '0.6',*/}
        {/*    }}*/}
        {/*    icon={<LocalOfferIcon />}*/}
        {/*    options={[{ value: 'category', label: 'By Category' }]}*/}
        {/*  />*/}
        {/*</Stack>*/}
        <Stack
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            rowGap: '30px',
            columnGap: '40px',
            padding: '20px',
            justifyContent: 'start',
          }}
        >
          {spaces.length > 0
            ? spaces.map((item, index) => (
                <Grid
                  item
                  key={item.id}
                  xs={12}
                  sm={6}
                  md={4}
                  xl={3}
                  sx={{ display: 'flex', justifyContent: 'center' }}
                >
                  <SpaceCard
                    id={item.id}
                    logoImage={
                      item.avatar !== 'undefined' &&
                      item.avatar &&
                      !item.avatar.includes('blob')
                        ? item.avatar
                        : '/1.webp'
                    }
                    bgImage={
                      item.banner !== 'undefined' &&
                      item.banner &&
                      !item.banner.includes('blob')
                        ? item.banner
                        : '/5.webp'
                    }
                    title={item.name}
                    description={item.description}
                    members={item.members}
                    categories={item.category}
                    tagline={item.tagline}
                  />
                </Grid>
              ))
            : Array.from({ length: 12 }).map((_, index) => {
                return (
                  <Grid
                    item
                    key={index}
                    xs={12}
                    sm={6}
                    md={4}
                    xl={3}
                    sx={{ display: 'flex', justifyContent: 'center' }}
                  >
                    <SpaceCardSkeleton />
                  </Grid>
                );
              })}
        </Stack>
      </Stack>
      {/*<SidebarLeft />*/}
    </Stack>
  );
};

export default Home;
