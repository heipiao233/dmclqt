import { Direction, QBoxLayout, QComboBox, QDialog, QGridLayout, QListWidget, QListWidgetItem, QPushButton } from '@nodegui/nodegui';
import { Account, Launcher, UserData } from 'dmclc';
import { config, saveConfig } from '../config';
import launcherInterface from '../launcherInterface';
import { Tab } from '../tabs';
export default class SelectAccountTab extends Tab {
    accounts = new Map<string, Account<any & UserData>>();
    allAccounts = new QListWidget();
    constructor(private launcher: Launcher, sharedData: Map<string, any>){
        super();
        const layout = new QGridLayout();
        this.setLayout(layout);
        layout.addWidget(this.allAccounts, 0, 0, 1, 2);
        const addNewAccountButton = new QPushButton();
        addNewAccountButton.setText("添加账户");
        layout.addWidget(addNewAccountButton, 1, 0);
        config.users.forEach(account=>{
            const acc = launcher.accountTypes.get(account.type)?.call({}, account.data);
            if(acc===undefined)return;
            this.accounts.set(acc.toString(), acc);
        })
        this.allAccounts.addEventListener("itemActivated", async (item)=>{
            sharedData.set("account", this.accounts.get(item.text()));
            config.usingUser = this.allAccounts.currentRow();
            saveConfig();
        });
        addNewAccountButton.addEventListener("clicked", async () => await this.addNewAccount());

        const deleteButton = new QPushButton();
        deleteButton.setText("删除账户");
        deleteButton.addEventListener("clicked", () => {
            if (this.allAccounts.count() == 1) {
                launcherInterface.error("不能删除仅有的一个！");
                return;
            }
            const row = this.allAccounts.currentRow();
            const uuid = this.accounts.get(this.allAccounts.currentItem().text())?.data.uuid;
            this.allAccounts.takeItem(row);
            config.users.splice(config.users.findIndex(i => i.data.uuid === uuid), 1);
            if (config.usingUser >= row) {
                config.usingUser --;
                sharedData.set("account", this.accounts.get(this.allAccounts.item(config.usingUser).text()))
            }
            saveConfig();
        });
        deleteButton.setDisabled(true);
        this.allAccounts.addEventListener("itemSelectionChanged", () => {
            if (this.allAccounts.selectedItems().length > 0) {
                deleteButton.setDisabled(false);
            } else {
                deleteButton.setDisabled(true);
            }
        });
        layout.addWidget(deleteButton, 1, 1);
    }
    async addNewAccount() {
        const selectTypeDialog = new QDialog();
        const selectTypeLayout = new QBoxLayout(Direction.TopToBottom);
        const selectTypeMenu = new QComboBox();
        const indexToAccount = new Map<number, (data: any | UserData) => Account<any & UserData>>();
        const indexToAccountType = new Map<number, string>();
        let index = 0;
        this.launcher.accountTypes.forEach((v, k) => {
            selectTypeMenu.addItem(undefined, this.launcher.i18n("accounts." + k + ".name"));
            indexToAccountType.set(index, k);
            indexToAccount.set(index++, v);
        });
        selectTypeLayout.addWidget(selectTypeMenu);
        const OKButton = new QPushButton();
        OKButton.setText("好");
        OKButton.addEventListener("clicked", async ()=>{
            try {
                selectTypeDialog.close();
                const accountIndex = selectTypeMenu.currentIndex();
                const account = indexToAccount.get(accountIndex)!({});
                if (!await account.login()) {
                    launcherInterface.error("登录验证失败！");
                    return;
                }
                if (config.users.findIndex(i => i.data.uuid === account.data.uuid) != -1) {
                    launcherInterface.error("账户已存在！");
                    return;
                }
                config.users.push({
                    type: indexToAccountType.get(selectTypeMenu.currentIndex())!,
                    data: account.data
                });
                saveConfig();
                this.accounts.set(account.toString(), account);
                this.allAccounts.addItem(new QListWidgetItem(account.toString()));
            } catch {
                launcherInterface.error("登录出错！");
            }
        });
        selectTypeLayout.addWidget(OKButton);
        selectTypeDialog.setLayout(selectTypeLayout);
        selectTypeDialog.setWindowTitle("选择账户类型");
        selectTypeDialog.show();
    }
    async onSelected() {
        this.allAccounts.clear();
        for (const i of this.accounts.keys()) {
            this.allAccounts.addItem(new QListWidgetItem(i));
        }
    }
}
