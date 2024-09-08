/* SPDX-License-Identifier: MulanPSL-2.0 */

import { Button, Drawer, Input } from "antd";
import { GetSeatsResponseDtoEntry } from "../../api/SeatController";
import { useState } from "react";
import { request } from "../../utils/request";
import { globalHooks } from "../../common/GlobalData";
import { useConstructor } from "../../utils/react-functional-helpers";


export interface ChangeNicknameDrawerProps {
    seat: GetSeatsResponseDtoEntry | null
    onClose: (newName: string) => void
}


export function ChangeNicknameDrawer(props: ChangeNicknameDrawerProps) {



    /* state */

    const [name, setName] = useState('')
    const [confirmLoading, setConfirmLoading] = useState(false)


    /* methods */


    function upload(name: string) {
        setConfirmLoading(true)
        request({
            url: 'seat/name',
            method: 'post',
            data: {
                seatId: props.seat?.id,
                name: name
            },
            vfOpts: {
                rejectNonOKResults: true, 
                autoHandleNonOKResults: true, 
                giveResDataToCaller: true
            }
        }).then(res => {
            globalHooks.app.message.success('成功')
            close(name)
        }).catch(err => {}).finally(() => {
            setConfirmLoading(false)
        })
    }


    function close(newName: string) {
        setName('')
        props.onClose(newName)
        
    }

    /* render */


    return <Drawer
        destroyOnClose={true}
        onClose={() => {
            close(props.seat!.nickname)
        }}

        open={props.seat !== null}
        title={'编辑主机名'}
    >
        <p>
            编号：{props.seat?.id}
        </p>
        <p>
            原名：{props.seat?.nickname}
        </p>
        <Input
            value={name}
            placeholder="输入新名称"
            onChange={(event) => {
                setName(event.currentTarget.value)
            }}
            disabled={confirmLoading}
        />

        <Button
            disabled={confirmLoading}
            shape="round"
            style={{
                width: '100%',
                marginTop: 16
            }}
            type="primary"
            onClick={() => {
                upload(name)
            }}
        >
            提交
        </Button>
        

    </Drawer>
}
