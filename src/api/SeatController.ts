// SPDX-License-Identifier: MulanPSL-2.0
/*

    created on April 19, 2024 at Anting, Jiading Shanghai
*/

import { SeatEntity } from "./Entities"


export interface CreateSeatsResponseDtoEntry {
    userId: number
    groupId: number | null
    seatInfo: SeatEntity
}

export type CreateSeatsResponseDto =  CreateSeatsResponseDtoEntry[]
