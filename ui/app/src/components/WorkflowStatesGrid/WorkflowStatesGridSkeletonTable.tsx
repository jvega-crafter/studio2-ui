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

import React from 'react';
import TableContainer from '@material-ui/core/TableContainer';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import Skeleton from '@material-ui/lab/Skeleton';
import GlobalAppGridRow from '../GlobalAppGridRow';
import GlobalAppGridCell from '../GlobalAppGridCell';
import { rand } from '../PathNavigator/utils';
import { FormattedMessage } from 'react-intl';
import Typography from '@material-ui/core/Typography';

export interface WorkflowStatesGridSkeletonTableProps {
  numOfItems?: number;
}

export const WorkflowStatesGridSkeletonTable = React.memo((props: WorkflowStatesGridSkeletonTableProps) => {
  const { numOfItems = 10 } = props;
  const items = new Array(numOfItems).fill(null);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <GlobalAppGridRow className="hoverDisabled">
            <GlobalAppGridCell className="bordered">
              <Typography variant="subtitle2">
                <FormattedMessage id="workflowStates.selectAll" defaultMessage="Select All" />
              </Typography>
            </GlobalAppGridCell>
            <GlobalAppGridCell className="bordered">
              <Typography variant="subtitle2">
                <FormattedMessage id="words.id" defaultMessage="ID" />
              </Typography>
            </GlobalAppGridCell>
            <GlobalAppGridCell className="bordered">
              <Typography variant="subtitle2">
                <FormattedMessage id="words.state" defaultMessage="State" />
              </Typography>
            </GlobalAppGridCell>
            <GlobalAppGridCell className="bordered">
              <Typography variant="subtitle2">
                <FormattedMessage id="workflowStates.systemProcessing" defaultMessage="System Processing" />
              </Typography>
            </GlobalAppGridCell>
          </GlobalAppGridRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <GlobalAppGridRow key={index}>
              <GlobalAppGridCell align="left">
                <Skeleton variant="text" width={`${rand(40, 60)}%`} />
              </GlobalAppGridCell>
              <GlobalAppGridCell align="left">
                <Skeleton variant="text" width={`${rand(40, 60)}%`} />
              </GlobalAppGridCell>
              <GlobalAppGridCell align="left">
                <Skeleton variant="text" width={`${rand(40, 60)}%`} />
              </GlobalAppGridCell>
              <GlobalAppGridCell align="left">
                <Skeleton variant="text" width={`${rand(40, 60)}%`} />
              </GlobalAppGridCell>
            </GlobalAppGridRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
