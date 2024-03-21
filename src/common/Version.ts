// SPDX-License-Identifier: MulanPSL-2.0
/* 上财果团团 */

export default class Version {

    static code = 1
    static tag = "1.0.0"

    /**
     * 构建时间。遵循 ISO8601 格式。
     */
    static buildTime = '2024-01-16T13:22+08:00'
    
    static branch = 'dev' as 'release' | 'beta' | 'dev'

    private constructor() {}
}
