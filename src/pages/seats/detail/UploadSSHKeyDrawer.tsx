/* SPDX-License-Identifier: MulanPSL-2.0 */

import { Alert, Button, Drawer, Input } from "antd";
import { SeatEntity } from "../../../api/Entities";
import { useState } from "react";
import { IResponse, request } from "../../../utils/request";
import StringUtils from "../../../utils/StringUtils";
import { HttpStatusCode } from "../../../utils/HttpStatusCode";

const { TextArea } = Input


export interface UploadSSHKeyDrawerProps {
    seat: SeatEntity
    open: boolean
    onClose: () => void
}


export function UploadSSHKeyDrawer(props: UploadSSHKeyDrawerProps) {


    /* states */

    const [inputValue, setInputValue] = useState('')
    const [loading, setLoading] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const [alertType, setAlertType] = useState<'success' | 'info' | 'warning' | 'error'>('info')
    const [alertMsg, setAlertMsg] = useState('')

    /* methods */

    function close() {
        setInputValue('')
        setLoading(false)
        setShowAlert(false)
        props.onClose()
    }


    function upload() {
        const keys = inputValue.split('\n').filter((value) => StringUtils.isNotBlank(value))
        setLoading(true)
        request({
            url: 'seat/sshKey',
            method: 'post',
            data: {
                keys: keys,
                seatId: props.seat.id
            }
        }).then((res: IResponse<number>) => {

            if (res.code === HttpStatusCode.OK) {
                setAlertMsg(`成功添加 ${res.data} 个SSH公钥。`)
                setAlertType('success')
            } else {
                setAlertMsg(res.msg)
                setAlertType('error')
            }

            setShowAlert(true)

        }).catch(err => {}).finally(() => {
            setLoading(false)
        })
    }

    /* render */

    return <Drawer
        destroyOnClose={true}
        maskClosable={false}
        onClose={close}
        open={props.open}
        title={`为 ${props.seat.nickname} (${props.seat.id}) 添加SSH公钥`}
    >
        <TextArea
            disabled={loading}
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            placeholder="在此输入SSH公钥"
            autoSize={{ minRows: 5 }}
        />

        <Button
            type="primary"
            shape="round"
            style={{
                width: '100%',
                marginTop: 16
            }}
            disabled={loading}
            onClick={upload}
        >
            上传
        </Button>

        {
            showAlert
            &&
            <Alert
                showIcon
                style={{
                    marginTop: 16
                }}
                type={alertType}
                message={alertMsg}
            />
        }
        

    </Drawer>
}
