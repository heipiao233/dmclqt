import { CheckState, Direction, QBoxLayout, QCheckBox, QComboBox, QGridLayout, QIcon, QLabel, QLineEdit, QListWidget, QListWidgetItem, QPixmap, QPushButton, QSizePolicyPolicy, QTextBrowser, QVariant } from '@nodegui/nodegui';
import { randomUUID } from 'crypto';
import { Content, ContentService, ContentType, ContentVersion, Launcher } from 'dmclc';
import { download } from 'dmclc/lib/utils/downloads';
import { MinecraftVersion } from 'dmclc/lib/version';
import { tmpdir } from 'os';
import launcherInterface from '../launcherInterface';
import { Tab, addTabAndSwitch } from '../tabs';

class VersionTab extends Tab {
    listWidget: QListWidget;

    constructor(list: ContentVersion[], launcher: Launcher, version: MinecraftVersion, isModpack: boolean) {
        super();
        const layout = new QBoxLayout(Direction.TopToBottom);
        this.listWidget = new QListWidget();
        this.listWidget.addEventListener("itemActivated", async () => {
            const ver = list[this.listWidget.currentRow()];
            if (isModpack) {
                const packPath = `${tmpdir()}/${await ver.getVersionFileName()}`;
                try {
                    if (!await download(await ver.getVersionFileURL(), packPath, launcher)){
                        launcherInterface.error(`下载整合包 ${ver.getContent()} 失败！`);
                        return;
                    }
                    launcher.installer.installModpackFromPath(packPath);
                } catch {
                    launcherInterface.error(`下载整合包 ${ver.getContent()} 失败！`);
                }
            }
            if (!version) {
                launcherInterface.error("未选择版本！");
                return;
            }
            try {
                await version.installContentVersion(ver);
            } catch {
                launcherInterface.error(`安装失败！`);
            }
        });
        layout.addWidget(this.listWidget);
        this.setLayout(layout);
    }

    static async create(list: ContentVersion[], launcher: Launcher, version: MinecraftVersion, isModpack: boolean): Promise<VersionTab> {
        const val = new VersionTab(list, launcher, version, isModpack);
        for (const i of list) {
            val.listWidget.addItem(new QListWidgetItem(await i.getVersionNumber()));
        }
        return val;
    }
}

class ContentInfoTab extends Tab {
    private constructor(iconPath: string, private name: string, desc: string, body: string,
        private versionList: ContentVersion[], private launcher: Launcher, private version: MinecraftVersion, private isModpack: boolean) {
        super();
        const layout = new QGridLayout();
        this.setLayout(layout);

        const iconLabel = new QLabel();
        iconLabel.setPixmap(new QPixmap(iconPath));
        layout.addWidget(iconLabel, 0, 0);

        const nameLabel = new QLabel();
        nameLabel.setText(name);
        layout.addWidget(nameLabel, 1, 0);

        const versionListButton = new QPushButton();
        versionListButton.setText("版本列表");
        versionListButton.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Minimum);
        versionListButton.addEventListener("clicked", () => this.openVersionList());
        layout.addWidget(versionListButton, 2, 0);

        const bodyBrowser = new QTextBrowser();
        bodyBrowser.setHtml(desc);
        bodyBrowser.insertHtml(body);
        layout.addWidget(bodyBrowser, 0, 1, 3);
    }

    static async create(launcher: Launcher, version: MinecraftVersion, content: Content, versionChecked: boolean, isModpack: boolean): Promise<ContentInfoTab | undefined> {
        const iconPath = `${tmpdir()}/icon-${randomUUID()}.png`;
        const forVersion = versionChecked ? version : undefined;
        try {
            await download(await content.getIconURL(), iconPath, launcher);
            return new ContentInfoTab(iconPath, await content.getTitle(),
                await content.getDescription(), await content.getBody(), await content.listVersions(forVersion), launcher, version, isModpack);
        } catch {
            launcherInterface.error(`获取 ${await content.getTitle()} 信息失败！`);
        }
    }

    async openVersionList() {
        addTabAndSwitch(await VersionTab.create(this.versionList, this.launcher, this.version, this.isModpack), `版本列表 - ${this.name}`);
    }
}

export default class ContentTab extends Tab {
    searchLayout: QBoxLayout;
    optionLayout: QBoxLayout;
    layout_: QBoxLayout;
    resultList: QListWidget;

    serviceCombo: QComboBox;
    typeCombo: QComboBox;
    sortCombo: QComboBox;
    versionCheck: QCheckBox;
    searchEdit: QLineEdit;

    current?: {
        service: ContentService<unknown>;
        name: string;
        type: ContentType;
        sort: unknown;
    };

    items: Content[] = [];
    constructor(private launcher: Launcher, private version: MinecraftVersion) {
        super();
        this.layout_ = new QBoxLayout(Direction.TopToBottom);
        this.setLayout(this.layout_);

        this.searchLayout = new QBoxLayout(Direction.LeftToRight);
        this.searchEdit = new QLineEdit();
        const searchButton = new QPushButton();
        searchButton.addEventListener("clicked", () => this.search());
        this.searchLayout.addWidget(this.searchEdit);
        this.searchLayout.addWidget(searchButton);

        this.optionLayout = new QBoxLayout(Direction.LeftToRight);
        this.serviceCombo = new QComboBox();
        for (const i of launcher.contentServices.keys()) {
            this.serviceCombo.addItem(new QIcon(), i);
        }
        this.serviceCombo.addEventListener("currentTextChanged", (text) => this.updateCombo(text));
        this.typeCombo = new QComboBox();
        this.sortCombo = new QComboBox();
        this.versionCheck = new QCheckBox();
        this.versionCheck.setText("只显示适用的");
        this.optionLayout.addWidget(this.serviceCombo);
        this.optionLayout.addWidget(this.typeCombo);
        this.optionLayout.addWidget(this.sortCombo);
        this.optionLayout.addWidget(this.versionCheck);
        this.updateCombo(this.serviceCombo.currentText());

        this.resultList = new QListWidget();
        this.resultList.addEventListener("itemActivated", async () => await this.showVersions(this.items[this.resultList.currentRow()]));

        const loadMoreButton = new QPushButton();
        loadMoreButton.addEventListener("clicked", async () => await this.loadMore());

        this.layout_.addLayout(this.searchLayout);
        this.layout_.addLayout(this.optionLayout);
        this.layout_.addWidget(this.resultList);
        this.layout_.addWidget(loadMoreButton);
    }

    async showVersions(arg0: Content) {
        const tab = await ContentInfoTab.create(this.launcher, this.version, arg0,
            this.versionCheck.checkState() == CheckState.Checked, this.typeCombo.itemData(this.typeCombo.currentIndex()).toInt() == ContentType.MODPACK
        );
        if (tab) addTabAndSwitch(tab, `内容信息 - ${await arg0.getTitle()}`);
    }

    updateCombo(text: string): void {
        const service = this.launcher.contentServices.get(text)!;
        this.typeCombo.clear();
        const unsupportedTypes = service.getUnsupportedContentTypes();
        for (let i = 0; i <= 5; i++) {
            if (!unsupportedTypes.includes(i)) {
                this.typeCombo.addItem(new QIcon(), ContentType[i], new QVariant(i));
            }
        }

        this.sortCombo.clear();
        const fields = service.getSortFields();
        for (const k in fields) {
            this.sortCombo.addItem(new QIcon(), k);
        }
    }

    async search() {
        this.resultList.clear();
        const service = this.launcher.contentServices.get(this.serviceCombo.currentText())!;
        const name = this.searchEdit.text();
        const type = this.typeCombo.itemData(this.typeCombo.currentIndex()).toInt();
        const sort = service.getSortFields()[this.sortCombo.currentText()];
        this.current = {
            service,
            name,
            type,
            sort
        }
        try {
            const result = await service.searchContent(name, 0, 20, type, sort,
                this.versionCheck.checkState() == CheckState.Checked
                    ? this.version
                    : undefined);
            this.items = result;
            for (const i of result) {
                const item = new QListWidgetItem();
                i.getTitle().then(v => item.setText(v));
                this.resultList.addItem(item);
            }
        } catch {
            launcherInterface.error(`搜索 ${name} 失败！`);
        }
    }

    async loadMore() {
        if (!this.current) {
            return;
        }
        if (this.items.length % 20 != 0) {
            return;
        }
        try {
            const result = await this.current.service.searchContent(this.current.name, this.items.length, 20, this.current.type, this.current.sort,
                this.versionCheck.checkState() == CheckState.Checked
                    ? this.version
                    : undefined);
            this.items.push(...result);
            for (const i of result) {
                const item = new QListWidgetItem();
                i.getTitle().then(v => item.setText(v));
                this.resultList.addItem(item);
            }
        } catch {
            launcherInterface.error(`加载 ${this.current.name} 失败！`);
        }
    }
}
