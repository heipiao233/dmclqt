import { QGridLayout, QTextBrowser } from "@nodegui/nodegui";
import { ChildProcess } from "child_process";
import { Tab } from "../tabs";

export default class LogTab extends Tab {
    constructor(process: ChildProcess) {
        super();
        let layout = new QGridLayout();
        this.setLayout(layout);
        const text = new QTextBrowser();
        text.setReadOnly(true);
        process.stdout?.on("data", data=>{
            text.append(`<pre>${data}</pre>`);
        });
        process.stderr?.on("data", data=>{
            text.append(`<pre style="color: red;">${data}</pre>`);
        });
        layout.addWidget(text);
    }
}
