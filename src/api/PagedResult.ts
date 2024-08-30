// SPDX-License-Identifier: MulanPSL-2.0

interface PagedResult <T> {
    records: T[]
    pageNo: number
    pageSize: number
    total: number
}

