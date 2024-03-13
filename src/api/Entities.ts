// SPDX-License-Identifier: MulanPSL-2.0

import { Permissions } from "./Permissions"

/*

    创建于2024年3月13日 上海市嘉定区
*/


export interface UserEntity {
    id: number
    username: string
    
    /** 未加密的。该成员值尽量不要被设置。 */
    passwd: string

    createTime: string
    lastLoginTime: string
}


export interface SeatEntity {
    id: number
    userId: number
    enabled: number
    linuxUid: number
    linuxLoginName: number
    linuxPasswdRaw: number
    createTime: string
    lastLoginTime: string
}

export interface PermissionGroupEntity {
    id: Permissions
    fullname: string
    note: string
}

export interface PermissionGrantEntity {
    userId: number
    permissionId: Permissions
}
