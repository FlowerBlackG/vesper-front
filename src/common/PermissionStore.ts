// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年3月30日 上海市嘉定区安亭镇
 */

import { GroupPermissionEntity, GroupPermissionGrantEntity } from "../api/Entities"
import { GroupPermission, Permission } from "../api/Permissions"


export class GroupPermissionStore {
    constructor() {}

    clear() {
        this.store.clear()
        this.ready = false
    }

    putGrantEntity(grant: GroupPermissionGrantEntity) {
        this.put(grant.groupId, grant.permissionId)
    }

    put(groupId: number, permission: GroupPermission) {
        if (!this.store.has(groupId)) {
            this.store.set(groupId, new Set<GroupPermission>())
        }

        this.store.get(groupId)?.add(permission)
    }

    contains(
        groupId: number | null | undefined | string, permission: GroupPermission
    ): boolean {

        // 输入错误处理
        if (groupId === null || groupId === undefined) {
            return false
        }

        if (typeof groupId === 'string') {
            groupId = Number(groupId)
            if (Number.isNaN(groupId)) {
                return false
            }
        }

        // 取值
        if (!this.store.has(groupId)) {
            return false
        }

        return this.store.get(groupId)!.has(permission)
    }

    has = this.contains
    includes = this.contains

    ready = false

    private store = new Map<number, Set<GroupPermission>>()

}


export class PermissionStore {
    constructor() {}

    clear() {
        this.ready = false
        this.store.clear()
    }

    put(permission: Permission) {
        this.store.add(permission)
    }


    add = this.put

    contains(permission: Permission): boolean {
        return this.store.has(permission)
    }

    has = this.contains
    includes = this.contains

    ready = false

    private store = new Set<Permission>()
}


