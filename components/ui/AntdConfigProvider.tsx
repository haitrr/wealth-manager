'use client';

import {ConfigProvider, theme} from "antd";

const {darkAlgorithm} = theme;
const AntdConfigProvider = (props: any) => {
    return <ConfigProvider theme={{algorithm: darkAlgorithm}}>
        {props.children}
    </ConfigProvider>
}

export default AntdConfigProvider;