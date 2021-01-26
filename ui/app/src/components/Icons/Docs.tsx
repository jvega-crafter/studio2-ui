/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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
import SvgIcon, { SvgIconProps } from '@material-ui/core/SvgIcon';

export default function Docs(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 6C13.45 4.9 15.55 4.5 17.5 4.5C18.95 4.5 20.49 4.72 21.77 5.29C22.5 5.62 22.99 6.33 22.99 7.14V18.42C22.99 19.73 21.77 20.69 20.51 20.36C19.53 20.11 18.49 20 17.49 20C15.93 20 14.27 20.25 12.93 20.92C12.34 21.22 11.66 21.22 11.06 20.92C9.72 20.26 8.06 20 6.5 20C5.5 20 4.46 20.11 3.48 20.36C2.22 20.68 1 19.72 1 18.42V7.14C1 6.33 1.49 5.62 2.22 5.29C3.51 4.72 5.05 4.5 6.5 4.5C8.45 4.5 10.55 4.9 12 6ZM19.8 18.21C20.42 18.32 21 17.86 21 17.23V7.76C21 7.29 20.66 6.88 20.2 6.78C19.33 6.59 18.42 6.5 17.5 6.5C15.8 6.5 13.35 7.15 12 8V19.51C13.35 18.66 15.8 18.01 17.5 18.01C18.27 18.01 19.05 18.07 19.8 18.21ZM17.8949 13.4608C17.6569 13.6917 17.3489 13.8142 17.0094 13.8142C16.2849 13.8142 15.6969 13.2263 15.6969 12.5053C15.6969 11.7808 16.2849 11.1893 17.0129 11.1858C17.3664 11.1858 17.6359 11.2908 17.8949 11.5253C17.9054 11.5323 17.9089 11.5428 17.9089 11.5533C17.9089 11.5638 17.9019 11.5743 17.8949 11.5813L17.6044 11.8823C17.5939 11.8963 17.5729 11.8963 17.5589 11.8823C17.4154 11.7563 17.2229 11.6828 17.0304 11.6828C16.5999 11.6828 16.2639 12.0363 16.2639 12.4878C16.2639 12.9323 16.6034 13.2823 17.0339 13.2823C17.2229 13.2823 17.4189 13.2123 17.5554 13.0933C17.5624 13.0898 17.5729 13.0863 17.5834 13.0863C17.5939 13.0863 17.6044 13.0898 17.6079 13.0968L17.8984 13.4083C17.9089 13.4188 17.9089 13.4468 17.8949 13.4608ZM18.2932 13.8696C18.2831 13.856 18.2425 13.8527 18.2222 13.8696C17.901 14.1469 17.4411 14.3092 16.9947 14.3092C15.9971 14.3092 15.2126 13.5179 15.1855 12.4966C15.2126 11.4754 15.9971 10.6841 16.9947 10.6841C17.4445 10.6841 17.9044 10.8498 18.2222 11.1237C18.2425 11.1406 18.2831 11.1372 18.2932 11.1237L18.9696 10.4034C18.9831 10.3899 18.9831 10.3459 18.9628 10.3256C18.7362 10.1058 18.4725 9.92657 18.1884 9.7913L18.114 9.76763L18.1275 9.15217C17.9382 9.08454 17.742 9.03043 17.5459 8.99662L17.2517 9.52754L17.1807 9.52077C16.9879 9.50386 16.8527 9.50386 16.6599 9.52077L16.5889 9.53092L16.2947 9C16.0986 9.03382 15.9024 9.08792 15.7097 9.15556L15.7198 9.76087L15.6556 9.7913C15.5034 9.86232 15.3512 9.95024 15.2058 10.0517L15.1483 10.0923L14.6275 9.78116C14.472 9.90966 14.33 10.0551 14.2015 10.2072L14.5126 10.728L14.472 10.7855C14.4145 10.8667 14.3604 10.9546 14.2995 11.0662L14.2522 11.1575C14.2454 11.171 14.2387 11.1837 14.2319 11.1964C14.2251 11.2091 14.2184 11.2217 14.2116 11.2353L14.1812 11.2995L13.5759 11.2928C13.5082 11.4821 13.4541 11.6783 13.4203 11.8744L13.9512 12.1686L13.9445 12.2396C13.9343 12.3377 13.9309 12.4188 13.9309 12.5C13.9309 12.5812 13.9343 12.6623 13.9445 12.7604L13.9512 12.8314L13.4203 13.1256C13.4541 13.3217 13.5082 13.5179 13.5759 13.7072L14.1812 13.6971L14.2116 13.7614C14.2184 13.7749 14.2251 13.7876 14.2319 13.8002C14.2387 13.8129 14.2454 13.8256 14.2522 13.8391L14.2995 13.9304C14.3604 14.042 14.4145 14.13 14.472 14.2111L14.5126 14.2686L14.2015 14.7894C14.33 14.9415 14.4754 15.087 14.6275 15.2155L15.1483 14.9043L15.2058 14.9449C15.3512 15.0464 15.5034 15.1343 15.6556 15.2053L15.7198 15.2358L15.7097 15.8444C15.899 15.9121 16.0952 15.9662 16.2913 16L16.5855 15.4691L16.6565 15.4758C16.8493 15.4928 16.9846 15.4928 17.1773 15.4758L17.2483 15.4691L17.5425 16C17.7387 15.9662 17.9348 15.9121 18.1242 15.8444L18.1106 15.229L18.185 15.2053C18.4691 15.0734 18.7329 14.8908 18.9594 14.671C18.9797 14.6507 18.9797 14.6068 18.9662 14.5932L18.2932 13.8696ZM4.16667 14.5C4.16667 14.6833 4.31667 14.8333 4.5 14.8333H8.5C8.68333 14.8333 8.83333 14.6833 8.83333 14.5V12.8333C8.83333 12.65 8.98333 12.5 9.16667 12.5C9.35 12.5 9.5 12.65 9.5 12.8333V14.8333C9.5 15.2 9.2 15.5 8.83333 15.5H4.16667C3.8 15.5 3.5 15.2 3.5 14.8333V10.1667C3.5 9.8 3.79667 9.5 4.16667 9.5H6.16667C6.35 9.5 6.5 9.65 6.5 9.83333C6.5 10.0167 6.35 10.1667 6.16667 10.1667H4.5C4.31667 10.1667 4.16667 10.3167 4.16667 10.5V14.5ZM7.5 10.1667C7.31667 10.1667 7.16667 10.0167 7.16667 9.83333C7.16667 9.65 7.31667 9.5 7.5 9.5H9.16667C9.35 9.5 9.5 9.65 9.5 9.83333V11.5C9.5 11.6833 9.35 11.8333 9.16667 11.8333C8.98333 11.8333 8.83333 11.6833 8.83333 11.5V10.6367L5.79 13.68C5.66 13.81 5.45 13.81 5.32 13.68C5.19 13.55 5.19 13.34 5.32 13.21L8.36333 10.1667H7.5Z" />
    </SvgIcon>
  );
}