/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年4月5日 上海市嘉定区
*/

import Random from "../../utils/Random"


const buttonStyleShared = {
    normal: {

        // background-color

        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        borderRadius: 24,
        height: 40,
        fontSize: 'larger',
        userSelect: 'none',
        boxShadow: '0 4px 10px #2f90b97f',
        transition: '0.2s',
    } as React.CSSProperties,

    hover: {

        // background-color
    } as React.CSSProperties,

    active: {
        opacity: 0.72
    } as React.CSSProperties
}


interface LoginPageBackgroundEntry {
    title: string
    url: string
    colors: {
        button: {
            normal: string
            boxShadow: string
            hover: string
        }
    }
    styles?: {
        button: {
            normal: React.CSSProperties
            hover: React.CSSProperties
            active: React.CSSProperties
        }
    }
}


export class LoginPageBackgroundManager {

    private entries : LoginPageBackgroundEntry[] = [
        {
            title: '嘉定校区鸟瞰',
            url: 'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231208_123408.1.webp',
            colors: {
                button: {
                    normal: '#2486b9',
                    boxShadow: '',
                    hover: '#1177b0'
                }
            }
        },

        {
            title: '肖四',
            url: 'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231211_125623.webp',
            colors: {
                button: {
                    normal: '#e8b004',
                    boxShadow: '',
                    hover: '#d9a40e'
                }
            }
        },

        {
            title: '嘉定校区图书馆',
            url: 'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231122_183343.webp',
            colors: {
                button: {
                    normal: '#4f4032',
                    boxShadow: '',
                    hover: '#66462a'
                }
            }
        },

        {
            title: '水杉',
            url: 'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20210412_092042.webp',
            colors: {
                button: {
                    normal: '#41ae3c',
                    boxShadow: '',
                    hover: '#20894d'
                }
            }
        },

        {
            title: '樱花冰糖',
            url: 'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20210326_183307.webp',
            colors: {
                button: {
                    normal: '#2f2f35',
                    boxShadow: '',
                    hover: '#2e317c'
                }
            }
        },

        {
            title: '樱花猫猫',
            url: 'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20210326_180029.webp',
            colors: {
                button: {
                    normal: '#f07c82',
                    boxShadow: '',
                    hover: '#f1939c'
                }
            }
        },

/*
        {
            title: '',
            url: '',
            colors: {
                button: {
                    normal: '',
                    boxShadow: '',
                    hover: ''
                }
            }
        },
*/
    ]


    private backgroundEntry = null as LoginPageBackgroundEntry | null
    private constructor() {
        for (let it of this.entries) {
            let boxShadowColor = it.colors.button.boxShadow
            if (boxShadowColor.length === 0) {
                boxShadowColor = `${it.colors.button.normal}7f`
            }
            let buttonStyleNormal = {
                ...buttonStyleShared.normal,
                backgroundColor: it.colors.button.normal,
                boxShadow: `0 4px 10px ${boxShadowColor}`
            } as React.CSSProperties

            let buttonStyleHover = {
                ...buttonStyleNormal,
                ...buttonStyleShared.hover,
                backgroundColor: it.colors.button.hover
            } as React.CSSProperties

            let buttonStyles = {
                normal: buttonStyleNormal,
                hover: buttonStyleHover,
                active: {
                    ...buttonStyleHover,
                    ...buttonStyleShared.active
                } as React.CSSProperties
            }

            it.styles = {
                button: buttonStyles
            }
        }

        this.random()
        
    }


    private static _instance: LoginPageBackgroundManager


    static get instance(): LoginPageBackgroundManager {
        if (!LoginPageBackgroundManager._instance) {
            LoginPageBackgroundManager._instance = new LoginPageBackgroundManager()
        }

        return LoginPageBackgroundManager._instance
    }

    
    random() {
        this.backgroundEntry = Random.randElement(this.entries)
    }

    get background(): LoginPageBackgroundEntry {
        return this.backgroundEntry!
    }

    get all() {
        return this.entries
    }

}


