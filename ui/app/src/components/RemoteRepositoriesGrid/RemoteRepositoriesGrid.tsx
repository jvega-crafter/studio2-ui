/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Resource } from '../../models/Resource';
import { MergeStrategy, Repository } from '../../models/Repository';
import RemoteRepositoriesGridUI from './RemoteRepositoriesGridUI';
import React, { useState } from 'react';
import RemoteRepositoriesPullDialog from '../RemoteRepositoriesPullDialog/RemoteRepositoriesPullDialog';
import { defineMessages, useIntl } from 'react-intl';
import RemoteRepositoriesPushDialog from '../RemoteRepositoriesPushDialog';
import { deleteRemote as deleteRemoteService } from '../../services/repositories';
import { showSystemNotification } from '../../state/actions/system';
import { showErrorDialog } from '../../state/reducers/dialogs/error';
import { useActiveSiteId } from '../../utils/hooks';
import { useDispatch } from 'react-redux';

const messages = defineMessages({
  mergeStrategyNone: {
    id: 'repositories.mergeStrategyNone',
    defaultMessage: 'None'
  },
  mergeStrategyOurs: {
    id: 'repositories.mergeStrategyOurs',
    defaultMessage: 'Accept Ours'
  },
  mergeStrategyTheirs: {
    id: 'repositories.mergeStrategyTheirs',
    defaultMessage: 'Accept Theirs'
  },
  remoteDeleteSuccessMessage: {
    id: 'repositories.remoteDeleteSuccessMessage',
    defaultMessage: 'Remote repository deleted successfully.'
  },
  pullSuccessMessage: {
    id: 'repositories.pullSuccessMessage',
    defaultMessage: ''
  },
  pushSuccessMessage: {
    id: 'repositories.pushSuccessMessage',
    defaultMessage: ''
  }
});

export interface RemoteRepositoriesGridProps {
  resource: Resource<Array<Repository>>;
  fetchStatus(): void;
  fetchRepositories(): void;
}

export default function RemoteRepositoriesGrid(props: RemoteRepositoriesGridProps) {
  const { resource, fetchStatus, fetchRepositories } = props;
  const [openRepositoriesPullDialog, setOpenRepositoriesPullDialog] = useState(false);
  const [openRepositoriesPushDialog, setOpenRepositoriesPushDialog] = useState(false);
  const [repositoriesPullDialogBranches, setRepositoriesPullDialogBranches] = useState([]);
  const [repositoriesPushDialogBranches, setRepositoriesPushDialogBranches] = useState([]);
  const [pullRemoteName, setPullRemoteName] = useState(null);
  const [pushRemoteName, setPushRemoteName] = useState(null);
  const { formatMessage } = useIntl();
  const mergeStrategies: MergeStrategy[] = [
    {
      key: 'none',
      value: formatMessage(messages.mergeStrategyNone)
    },
    {
      key: 'ours',
      value: formatMessage(messages.mergeStrategyOurs)
    },
    {
      key: 'theirs',
      value: formatMessage(messages.mergeStrategyTheirs)
    }
  ];
  const siteId = useActiveSiteId();
  const dispatch = useDispatch();

  const onClickPull = (remoteName: string, branches: string[]) => {
    setRepositoriesPullDialogBranches(branches);
    setPullRemoteName(remoteName);
    setOpenRepositoriesPullDialog(true);
  };
  const onClickPush = (remoteName: string, branches: string[]) => {
    setRepositoriesPushDialogBranches(branches);
    setPushRemoteName(remoteName);
    setOpenRepositoriesPushDialog(true);
  };
  const onPullSuccess = () => {
    fetchStatus();
    dispatch(
      showSystemNotification({
        message: formatMessage(messages.pullSuccessMessage),
        options: { variant: 'success' }
      })
    );
  };
  const onPullError = (response) => {
    fetchStatus();
    dispatch(showErrorDialog({ error: response }));
  };
  const onPushSuccess = () => {
    dispatch(
      showSystemNotification({
        message: formatMessage(messages.pushSuccessMessage),
        options: { variant: 'success' }
      })
    );
  };
  const onPushError = (response) => {
    dispatch(showErrorDialog({ error: response }));
  };
  const deleteRemote = (remoteName: string) => {
    deleteRemoteService(siteId, remoteName).subscribe(
      () => {
        fetchRepositories();
        dispatch(
          showSystemNotification({
            message: formatMessage(messages.remoteDeleteSuccessMessage),
            options: { variant: 'success' }
          })
        );
      },
      ({ response }) => {
        dispatch(showErrorDialog({ error: response }));
      }
    );
  };

  return (
    <>
      <RemoteRepositoriesGridUI
        resource={resource}
        onClickPull={onClickPull}
        onClickPush={onClickPush}
        onDeleteRemote={deleteRemote}
      />
      <RemoteRepositoriesPullDialog
        open={openRepositoriesPullDialog}
        onClose={() => setOpenRepositoriesPullDialog(false)}
        branches={repositoriesPullDialogBranches}
        remoteName={pullRemoteName}
        mergeStrategies={mergeStrategies}
        onPullSuccess={onPullSuccess}
        onPullError={onPullError}
      />
      <RemoteRepositoriesPushDialog
        open={openRepositoriesPushDialog}
        branches={repositoriesPushDialogBranches}
        remoteName={pushRemoteName}
        onClose={() => setOpenRepositoriesPushDialog(false)}
        onPushSuccess={onPushSuccess}
        onPushError={onPushError}
      />
    </>
  );
}
