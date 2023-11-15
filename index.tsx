import { Html } from "@elysiajs/html";
import Elysia from "elysia";
import QooApi from "./lib/qoo-api";
import { Attributes, Component, ComponentChild, ComponentChildren, Ref } from "preact";


const AppRegex = new RegExp('^https://apps.qoo-app.com/en/app/[0-9]+$');
const app = new Elysia();
const qoo = new QooApi();

app.get('/', () => Bun.file("public/index.html"))
app.get('/shiggy', () => Bun.file("public/shiggy.gif"))
app.get('/index.css', () => Bun.file("public/index.css"))
app.get('/get', async(req) => {
    if (!req.query.qoop) {
        return new CardBody().render({ children: ErrorComp({ text: "Missing required field!" })  })
    }
    if (!AppRegex.test(req.query.qoop)) {
        return new CardBody().render({ children: ErrorComp({ text: "Link given did not match the required pattern"}) })
    }

    const data = await qoo.generateAppData(req.query.qoop)
    if (!data.direct_download) return new CardBody().render({ children: ErrorComp({ text: "Did not return a successfull direct download url, are you sure its not a game that require pre-registeration." }) })
    return new CardBody().render({
        children: DownloadButton({ url: data.direct_download })
    })
})
app.get('/sakuratrick', () => Bun.file("public/sakura_trick.gif"))

const serv = app.listen(3e3)
console.log(`Hosted on ${app.server?.hostname}:${app.server?.port}`)

function DownloadButton(props: any): JSX.Element {
    return (
        <div hx-boost="true">
            <a href={props.url} class="btn btn-neutral my-2">Download!</a>
        </div>
    )
}

function ErrorComp(props: any): JSX.Element {
    return (
        <div class="shit text-red-600 h-auto w-auto rounded-xl relative text-center">
            <p>{props.text}</p>
        </div>
    )
}

class CardBody extends Component {
    constructor() {
        super();
    }
    render(props?: Readonly<Attributes & { children?: ComponentChildren; ref?: Ref<any> | undefined; }> | undefined, state?: Readonly<{}> | undefined, context?: any): ComponentChild {
        return (
            <div class="w-[30vw] h-[5vw] text-center rounded-xl flex flex-col shit">
                {props?.children}
                <img src="/sakuratrick" alt="" class="rounded-xl"></img>
            </div>
        )
    }
}