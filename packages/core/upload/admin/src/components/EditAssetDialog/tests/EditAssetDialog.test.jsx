import React from 'react';

import { lightTheme, ThemeProvider } from '@strapi/design-system';
import { NotificationsProvider } from '@strapi/helper-plugin';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';

import en from '../../../translations/en.json';
import { downloadFile } from '../../../utils/downloadFile';
import { EditAssetDialog } from '../index';

jest.mock('../../../hooks/useFolderStructure');
jest.mock('../../../utils/downloadFile');

const messageForPlugin = Object.keys(en).reduce((acc, curr) => {
  acc[curr] = `upload.${en[curr]}`;

  return acc;
}, {});

const asset = {
  id: 8,
  name: 'Screenshot 2.png',
  alternativeText: '',
  caption: null,
  width: 1476,
  height: 780,
  formats: {
    thumbnail: {
      name: 'thumbnail_Screenshot 2.png',
      hash: 'thumbnail_Screenshot_2_5d4a574d61',
      ext: '.png',
      mime: 'image/png',
      width: 245,
      height: 129,
      size: 10.7,
      path: null,
      url: '/uploads/thumbnail_Screenshot_2_5d4a574d61.png',
    },
    large: {
      name: 'large_Screenshot 2.png',
      hash: 'large_Screenshot_2_5d4a574d61',
      ext: '.png',
      mime: 'image/png',
      width: 1000,
      height: 528,
      size: 97.1,
      path: null,
      url: '/uploads/large_Screenshot_2_5d4a574d61.png',
    },
    medium: {
      name: 'medium_Screenshot 2.png',
      hash: 'medium_Screenshot_2_5d4a574d61',
      ext: '.png',
      mime: 'image/png',
      width: 750,
      height: 396,
      size: 58.7,
      path: null,
      url: '/uploads/medium_Screenshot_2_5d4a574d61.png',
    },
    small: {
      name: 'small_Screenshot 2.png',
      hash: 'small_Screenshot_2_5d4a574d61',
      ext: '.png',
      mime: 'image/png',
      width: 500,
      height: 264,
      size: 31.06,
      path: null,
      url: '/uploads/small_Screenshot_2_5d4a574d61.png',
    },
  },
  hash: 'Screenshot_2_5d4a574d61',
  ext: '.png',
  mime: 'image/png',
  size: 102.01,
  url: '/uploads/Screenshot_2_5d4a574d61.png',
  previewUrl: null,
  provider: 'local',
  provider_metadata: null,
  createdAt: '2021-10-04T09:42:31.670Z',
  updatedAt: '2021-10-04T09:42:31.670Z',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const renderCompo = (props = { canUpdate: true, canCopyLink: true, canDownload: true }) =>
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={lightTheme}>
        <IntlProvider locale="en" messages={messageForPlugin} defaultLocale="en">
          <NotificationsProvider>
            <EditAssetDialog asset={asset} onClose={jest.fn()} {...props} />
          </NotificationsProvider>
        </IntlProvider>
      </ThemeProvider>
    </QueryClientProvider>,
    { container: document.getElementById('app') }
  );

describe('<EditAssetDialog />', () => {
  const RealNow = Date.now;
  let confirmSpy;

  beforeAll(() => {
    confirmSpy = jest.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(jest.fn(() => true));
    global.Date.now = jest.fn(() => new Date('2021-09-20').getTime());
  });

  afterAll(() => {
    confirmSpy.mockRestore();
    global.Date.now = RealNow;
  });

  it('renders and matches the snapshot', () => {
    renderCompo();

    expect(document.body).toMatchSnapshot();
  });

  describe('metadata form', () => {
    it('checks the default information set in the form', () => {
      renderCompo();

      expect(screen.getByLabelText('File name')).toHaveValue('Screenshot 2.png');
      expect(screen.getByLabelText('Alternative text')).toHaveValue('');
      expect(screen.getByLabelText('Caption')).toHaveValue('');
    });

    it('open confirm box on close if data has changed', () => {
      const { getByRole } = renderCompo();

      fireEvent.change(getByRole('textbox', { name: /alternative text/i }), {
        target: { value: 'Test' },
      });
      fireEvent.click(getByRole('button', { name: /cancel/i }));

      expect(window.confirm).toBeCalled();
    });

    it('disables all the actions and field when the user is not allowed to update', () => {
      renderCompo({ canUpdate: false, canCopyLink: false, canDownload: false });

      expect(screen.getByLabelText('File name')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByLabelText('Alternative text')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByLabelText('Caption')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByText('Finish').parentElement).toHaveAttribute('aria-disabled', 'true');
    });

    it('shows an error on the FileName input when its not filled', async () => {
      renderCompo();

      fireEvent.change(screen.getByLabelText('File name'), { target: { value: '' } });
      fireEvent.click(screen.getByText('Finish'));

      await waitFor(() => expect(screen.getByText('name is a required field')).toBeInTheDocument());
    });
  });

  describe('PreviewBox', () => {
    it('opens the delete dialog when pressing the delete button when the user is allowed to update', () => {
      renderCompo({ canUpdate: true, canCopyLink: false, canDownload: false });

      fireEvent.click(screen.getByLabelText('Delete'));

      expect(screen.getByText('Confirmation')).toBeVisible();
      expect(screen.getByText('Are you sure?')).toBeVisible();
    });

    it('does not open the delete dialog when the user is not allowed to update', () => {
      renderCompo({ canUpdate: false, canCopyLink: false, canDownload: false });

      expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
    });

    it('copies the link and shows a notification when pressing "Copy link" and the user has permission to copy', async () => {
      renderCompo({ canUpdate: false, canCopyLink: true, canDownload: false });

      fireEvent.click(screen.getByLabelText('Copy link'));

      await waitFor(() =>
        expect(screen.getByText('Link copied into the clipboard')).toBeInTheDocument()
      );
    });

    it('hides the copy link button when the user is not allowed to see it', () => {
      renderCompo({ canUpdate: false, canCopyLink: false, canDownload: false });

      expect(screen.queryByLabelText('Copy link')).not.toBeInTheDocument();
    });

    it('downloads the file when pressing "Download" and the user has the right to download', () => {
      renderCompo({ canUpdate: false, canCopyLink: false, canDownload: true });

      fireEvent.click(screen.getByLabelText('Download'));
      expect(downloadFile).toHaveBeenCalledWith(
        'http://localhost:1337/uploads/Screenshot_2_5d4a574d61.png',
        'Screenshot 2.png'
      );
    });

    it('hides the download button when the user is not allowed to download it', () => {
      renderCompo({ canUpdate: false, canCopyLink: false, canDownload: false });

      expect(screen.queryByLabelText('Download')).not.toBeInTheDocument();
    });

    it('shows the crop link when the user is allowed to update', () => {
      renderCompo({ canUpdate: true, canCopyLink: false, canDownload: false });

      expect(screen.getByLabelText('Crop')).toBeInTheDocument();
    });

    it('hides the crop link when the user is not allowed to update', () => {
      renderCompo({ canUpdate: false, canCopyLink: false, canDownload: false });

      expect(screen.queryByLabelText('Crop')).not.toBeInTheDocument();
    });
  });

  describe('replace media', () => {
    it('disables the replacement media button when the user is not allowed to update', () => {
      renderCompo({ canUpdate: false, canCopyLink: false, canDownload: false });

      expect(screen.getByText('Replace media').parentElement).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });

    it('replaces the media when pressing the replace media button', async () => {
      const file = new File(['Replacement media'], 'test.png', { type: 'image/png' });

      const fileList = [file];
      fileList.item = (i) => fileList[i];

      renderCompo({
        canUpdate: true,
        canCopyLink: false,
        canDownload: false,
      });

      fireEvent.change(document.querySelector('[type="file"]'), { target: { files: fileList } });
      const img = document.querySelector('img');

      expect(img).toHaveAttribute('src', 'http://localhost:4000/assets/test.png');
    });
  });
});
