import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';

import { createMockRouterProps, render } from '../../../../tests/utils/rendering';
import { RoutesConfig } from '../../../../app/config/routes';
import { CrudDemoItemList } from '../crudDemoItemList.component';
import { getRelayEnv } from '../../../../tests/utils/relay';
import { fillCrudDemoItemListQuery } from '../../../../mocks/factories/crudDemoItem';
import { fillCommonQueryWithUser } from '../../../../shared/utils/commonQuery';

describe('CrudDemoItemList: Component', () => {
  const routePath = ['crudDemoItem', 'list'];
  const addRoutePath = ['crudDemoItem', 'add'];

  const Component = () => (
    <Routes>
      <Route path={RoutesConfig.getLocalePath(routePath)} element={<CrudDemoItemList />} />
      <Route path={RoutesConfig.getLocalePath(addRoutePath)} element={<span>CrudDemoItem add page mock</span>} />
    </Routes>
  );

  it('should render all items', async () => {
    const routerProps = createMockRouterProps(routePath);
    const relayEnvironment = getRelayEnv();
    const mockRequest = fillCrudDemoItemListQuery(relayEnvironment);

    const apolloMocks = [fillCommonQueryWithUser(relayEnvironment), mockRequest];
    render(<Component />, { routerProps, apolloMocks });

    expect(await screen.findByText(/Loading .../i)).toBeInTheDocument();
    expect(await screen.findByText('First item')).toBeInTheDocument();
    expect(await screen.findByText('Second item')).toBeInTheDocument();
  });

  it('should render link to add new item form', async () => {
    const routerProps = createMockRouterProps(routePath);
    const relayEnvironment = getRelayEnv();
    fillCrudDemoItemListQuery(relayEnvironment);

    render(<Component />, { relayEnvironment, routerProps });
    await userEvent.click(await screen.findByText(/add/i));

    expect(screen.getByText('CrudDemoItem add page mock')).toBeInTheDocument();
  });
});