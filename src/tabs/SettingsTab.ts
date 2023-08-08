import { QComboBox, QGridLayout, QPushButton } from "@nodegui/nodegui";
import { Launcher, getJavaVersion } from "dmclc";
import { Config, saveConfig } from "../config";
import { Tab, addTabAndSwitch } from "../tabs";
import SelectJavaTab from "./selectjava";

export class SettingsTab extends Tab {
    selectJavaPushButton = new QPushButton();
    mirrorComboBox = new QComboBox();
    layout_ = new QGridLayout();
    constructor(private launcher: Launcher, sharedData: Map<string, string>, config: Config) {
        super();

        this.selectJavaPushButton = new QPushButton();
        this.selectJavaPushButton.setText("选择 Java...");
        if (launcher.usingJava) {
            getJavaVersion(launcher.usingJava).then((name) => this.selectJavaPushButton.setText(name));
        }
        this.selectJavaPushButton.addEventListener("clicked", () => addTabAndSwitch(new SelectJavaTab(launcher, false), "选择 Java"));
        this.layout_.addWidget(this.selectJavaPushButton, 0, 0);

        this.mirrorComboBox.addItems(["BMCLAPI", "MCBBS", "官方"]);
        switch (config.mirror) {
            case "bmclapi2.bangbang93.com":
                this.mirrorComboBox.setCurrentIndex(0);
                break;

            case "download.mcbbs.net":
                this.mirrorComboBox.setCurrentIndex(1);
                break;

            default:
                this.mirrorComboBox.setCurrentIndex(2);
        }
        this.mirrorComboBox.addEventListener("currentIndexChanged", (index) => {
            switch (index) {
                case 0:
                    config.mirror = launcher.mirror = "bmclapi2.bangbang93.com";
                    break;

                case 1:
                    config.mirror = launcher.mirror = "download.mcbbs.net";
                    break;

                case 2:
                    config.mirror = launcher.mirror = undefined;
                    break;

                default:
                    break;
            }
            saveConfig();
        });
        this.layout_.addWidget(this.mirrorComboBox, 1, 0);
        this.setLayout(this.layout_);
    }

    async onSelected(): Promise<void> {
        if (this.launcher.usingJava) {
            this.selectJavaPushButton.setText(await getJavaVersion(this.launcher.usingJava))
        }
    }
}
