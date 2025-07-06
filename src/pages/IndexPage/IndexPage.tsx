import { Section, Cell, List } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';
import { Page } from '@/components/Page.tsx';
import { useNavigate } from 'react-router-dom';

export const IndexPage: FC = () => {
  const navigate = useNavigate();

  return (
    <Page back={false}>
      <List>
        <Section header="Welcome to Oil Tycoon Wars!">
          <Cell subtitle="Begin your journey as a swamper and build your oil empire." />
          <Cell
            subtitle="Enter the map"
            onClick={() => navigate('/map')}
          />
          <Cell
            subtitle="View garage"
            onClick={() => navigate('/garage')}
          />
        </Section>
      </List>
    </Page>
  );
};
