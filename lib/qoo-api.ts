import { randomBytes, randomUUID } from "crypto";
import QooApiStore from "./store"

export default class QooApi extends QooApiStore {
    public account!: QooAppConf
    private is_initialized: boolean = false
    constructor() {
        super();
    }

    public async generateAppData(url: string|URL|Request): Promise<generateAppDataInterface> {
        if (this.is_initialized === false) await this.init()
        const device_spoof = {
            supported_abis: "x86_64,arm64-v8a,x86,armeabi-v7a,armebi",
            device: "redfin",
            device_model: "Pixel 5",
            user_id: this.account.userId,
            device_id: this.account.x_device_id,
            token: this.account.token,
        }

        await this.fetch_qoo(`https://api.qoo-app.com/v7/user?${Object.entries(device_spoof).map(p => p.join('=')).join("&")}`, { method: "POST" })

        url = url.toString()
        url = url.slice(url.lastIndexOf('/')+1)
        url = `https://api.qoo-app.com/v10/apps/${url}`
        const app_ = await this.fetch_qoo(url, { method: 'GET' })
        const app_data = await app_.json();
        const fetch_apk = await this.fetch_qoo(`https://api.ppaooq.com/v11/apps/${app_data.data.package_id}/download?userId=${this.account.userId}&type=app&baseApkVersion=0&baseApkMd5=null`, { redirect: "follow", method: "HEAD" })
        const url_ify = new URL(fetch_apk.url)
        if (url_ify.origin === "https://api.ppaooq.com") return {
            app_name_en: app_data.data.app_name,
            icon_url: app_data.data.icon_url,
            direct_download: undefined,
            game_tags: app_data.data.game_tags,
            preview_banner: app_data.data.preview,
            related_app: app_data.data.app_relation
        }
        return {
            app_name_en: app_data.data.app_name,
            icon_url: app_data.data.icon_url,
            direct_download: fetch_apk.url,
            game_tags: app_data.data.game_tags,
            preview_banner: app_data.data.preview,
            related_app: app_data.data.app_relation
        }
    }

    public async init() {
        const file = await Bun.file("account.json")
        if (await file.exists()) {
            this.account = await this.read("account.json");
            this.is_initialized = true;
            return
        }
        if (await this.generateDevice()) await this.registerAccount();
        this.is_initialized = true;
        return
    }

    public async fetch_qoo(url: string|URL|Request, init?: RequestInit) {
        const headers = {
            ...init?.headers,
            ...await this.generateHeaders()
        }

        return await fetch(url, {
            ...init,
            headers,
            keepalive: false
        })
    }

    private async registerAccount() {
        if (this.is_initialized === false) await this.init()
        const start = await this.fetch_qoo(APIs.START.URL, { method: APIs.START.METHOD, body: JSON.stringify({ loginToken: "", sign: "" }) })
        const start_res = await start.json()
        console.log(start_res)
        await this.append("account.json", { loginToken: start_res.data.loginToken })
        await this.init();

        const loginForm = new FormData()
        loginForm.append("loginToken", this.account.loginToken as string ?? start_res.data.loginToken)
        loginForm.append("platformAccessToken", this.account.x_device_id)
        loginForm.append("type", "4"),
        loginForm.append("operateType", "login")
        loginForm.append("sign", "")
        loginForm.append("packageId", "")

        const login = await this.fetch_qoo(APIs.LOGIN.URL, { method: APIs.LOGIN.METHOD, body: loginForm })
        const login_res = await login.json();
        console.log(login_res)
        await this.append("account.json", { "token": login_res.data.token, "userId": login_res.data.user_id })
        await this.init();

        const device_spoof = {
            supported_abis: "x86_64,arm64,v8a,x86,armeabi-v7a,armebi",
            device: "redfin",
            device_model: "Pixel 5",
            user_id: this.account.userId,
            device_id: this.account.x_device_id,
            token: this.account.token,
        }

        await this.fetch_qoo(`https://api.qoo-app.com/v7/user?${Object.entries(device_spoof).map(p => p.join('=')).join("&")}`, { method: "POST" })
    }

    private async generateDevice() {
        const device: QooAppConf = {
            x_device_id: randomBytes(8).toString("hex"),
            x_version_code: "80335",
            x_version_name: "8.3.35",
            x_device_uuid: randomUUID({ disableEntropyCache: true })
        }
        return await this.write("account.json", device)
    }
    
    private async generateHeaders(): Promise<HeadersInit> {
        const account = await this.read("account.json")
        return {
            "x-device-id": account.x_device_id,
            "x-version-code": account.x_version_code,
            "x-version-name": account.x_version_name,
            "User-Agent": `QooApp ${account.x_version_name}`,
            "x-device-uuid": account.x_device_uuid,
            "x-user-token": account.token || "",
            "x-android-id": account.x_device_id,
            "x-device_model": "Pixel 5",
            "x-manufacturer": "Google",
            "x-system-locale": "en_US",
            "x-device-abis": "x86_64,arm64-v8a,x86,armeabi-v7a,armeabi",
            "x-sdk-version": "33"
        }
    }
}

interface QooAppConf {
    x_device_uuid: string;
    x_version_name: string,
    x_version_code: string,
    x_device_id: string,
    loginToken?: string,
    token?: string,
    userId?: string
}

interface generateAppDataInterface {
    app_name_en: string,
    icon_url: string,
    game_tags: generateAppDataInterfaceGameTags[],
    related_app: generateAppDataInterfaceRelatedApp[],
    preview_banner: string,
    direct_download?: string

}

interface generateAppDataInterfaceRelatedApp {
    id: number,
    name: string,
    icon_url: string
}

interface generateAppDataInterfaceGameTags {
    id: number,
    name: string
}

const APIs = {
    START: {
        URL: "https://api.qoo-app.com/v11/connection/start",
        METHOD: "POST"
    },
    LOGIN: {
        URL: "https://api.qoo-app.com/v11/connection/thirdLogin",
        METHOD: "POST"
    }
}