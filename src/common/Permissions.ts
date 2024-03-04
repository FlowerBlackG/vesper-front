// SPDX-License-Identifier: MulanPSL-2.0

/* 上财果团团 */

/*
 * 枚举内容应与后端 
 *   entity/BUserPermissionGroupEntity.PermissionGroup
 *   保持一致。
 */

/**
 * 权限枚举。
 */
export enum Permissions {

    UNDEFINED = (0),

    GRANT_PERMISSION = (1),

    CREATE_OR_DELETE_USER = (20),
    CREATE_OR_DELETE_SEAT = (50),


    LOGIN_TO_ANY_SEAT = (100),
}

