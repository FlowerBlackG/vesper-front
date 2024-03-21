// SPDX-License-Identifier: MulanPSL-2.0

import { Permission } from "./Permissions"

/*

    创建于2024年3月13日 上海市嘉定区
*/


export interface UserEntity {
    id: number
    creator: number
    username: string
    
    /** 未加密的。该成员值尽量不要被设置。 */
    passwd: string

    createTime: string
    lastLoginTime: string
}


export interface SeatEntity {
    id: number
    userId: number
    creator: number
    enabled: number
    linuxUid: number
    linuxLoginName: number
    linuxPasswdRaw: number
    createTime: string
    lastLoginTime: string
}

export interface PermissionEntity {
    id: Permission
    enumKey: string
    note: string
}

export interface PermissionGrantEntity {
    userId: number
    permissionId: Permission
}


export interface GroupPermissionEntity {
    id: Permission
    enumKey: string
    note: string
}

export interface GroupPermissionGrantEntity {
    userId: number
    groupId: number
    permissionId: Permission
}
