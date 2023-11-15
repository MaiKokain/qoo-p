import { BunFile } from "bun";

export default class QooApiStore {
    constructor() {}
    public async write<T extends object>(filename: BunFile|PathLike, data?: T) {
        const string_data = JSON.stringify(data);
        await Bun.write(filename, string_data);
        return await Bun.file(filename.toString()).exists()
    }
    public async read(filename: BunFile|PathLike): Promise<any> {
        const file = await Bun.file(filename.toString())
        return await file.json()
    }
    public async append(filename: BunFile|PathLike, data: object) {
        const orig = await this.read(filename);
        let to_append = {
            ...orig,
            ...data
        }
        await this.write(filename, to_append)
    }
}
