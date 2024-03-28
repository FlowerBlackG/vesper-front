// SPDX-License-Identifier: MulanPSL-2.0

import axios from "axios"

/*
 * 
 * 创建于 2024年3月28日 上海市嘉定区
 */


export default class Config {
    private constructor() {}

    /* public static fields */
    
    static get backendRoot() {
        return this._backendRoot
    } 

    static set backendRoot(url: string) {
        this._backendRoot = url
        axios.defaults.baseURL = url
    }


    /* private fields */
    
    static _backendRoot = 'http://localhost:9000'

}
