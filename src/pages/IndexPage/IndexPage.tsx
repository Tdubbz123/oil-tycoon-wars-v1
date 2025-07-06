import { Section, Cell, List } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';
//import image with section, cell and list if needed
//import { Link } from '@/components/Link/Link.tsx';
import { Page } from '@/components/Page.tsx';

//import tonSvg from './ton.svg';

export const IndexPage: FC = () => {
  return (
    <Page back={false}>
      <List>
        <Section header="Welcome to Oil Tycoon Wars!">
          <Cell subtitle="Begin your journey as a swamper and build your oil empire." />
          <Cell
            subtitle="Enter the map"
            onClick={() => window.location.href = '/map'}
          />
          <Cell
            subtitle="View garage"
            onClick={() => window.location.href = '/garage'}
          />
        </Section>
      </List>
    </Page>
  );
};
