import * as React from "react";
import { useEffect,useState } from "react";
import { Button, Classes, Dialog, FormGroup,InputGroup } from "@blueprintjs/core";
import { observer } from "mobx-react";

import { AppStore, DialogId, DialogStore } from "stores";

export const BranchWorkspaceDialogComponent = observer(() => {
    const appStore = AppStore.Instance;
    const dialogStore = DialogStore.Instance;
    const [branchName, setBranchName] = useState("");
    const isOpen = dialogStore.dialogVisible.get(DialogId.BranchWorkspace);
    const workspace = appStore.activeWorkspace;
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [currentBranch, setCurrentBranch] = useState<string>("");

    useEffect(() => {
        async function fetchBranches() {
            if (workspace) {
                const branchInfo = await appStore.listWorkspaceBranches(workspace.name);
                setBranches(branchInfo?.branches || []);
                setCurrentBranch(branchInfo?.current || "");
                setSelectedBranch(branchInfo?.current || "");
            }
        }
        if (isOpen && workspace) {
            fetchBranches();
        }
    }, [isOpen, workspace, appStore]);

    const handleClose = () => {
        dialogStore.hideDialog(DialogId.BranchWorkspace);
        setBranchName("");
    };

    const handleBranch = async () => {
        if (workspace && branchName.trim()) {
            await appStore.branchWorkspace(workspace.name, branchName.trim());
        }
        handleClose();
    };

    const handleSwitchBranch = async () => {
        if (!workspace || !selectedBranch || selectedBranch === currentBranch) return;
        const success = await appStore.switchWorkspaceBranch(workspace.name, selectedBranch);
        if (success) {
            // Refresh branch info after switching
            const branchInfo = await appStore.listWorkspaceBranches(workspace.name);
            setBranches(branchInfo?.branches || []);
            setCurrentBranch(branchInfo?.current || "");
            setSelectedBranch(branchInfo?.current || "");
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            title="Branch Workspace"
            canEscapeKeyClose
            canOutsideClickClose
            className={Classes.DIALOG}
        >
            <div className={Classes.DIALOG_BODY}>
                <FormGroup label="Workspace Name">
                    <InputGroup value={workspace?.name || ""} readOnly />
                </FormGroup>
                <FormGroup label="Branch Name" helperText="Enter a name for the new branch.">
                    <InputGroup
                        value={branchName}
                        onChange={e => setBranchName(e.currentTarget.value)}
                        placeholder="Branch name"
                        autoFocus
                    />
                </FormGroup>
                <FormGroup label="Switch Branch">
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <select
                            value={selectedBranch}
                            onChange={e => setSelectedBranch(e.target.value)}
                            style={{ minWidth: 120 }}
                        >
                            {branches.map(branch => (
                                <option key={branch} value={branch}>
                                    {branch}
                                </option>
                            ))}
                        </select>
                        <span style={{ marginLeft: 16, fontStyle: "italic" }}>
                            Current: {currentBranch}
                        </span>
                        <Button
                            style={{ marginLeft: 16 }}
                            intent="primary"
                            onClick={handleSwitchBranch}
                            disabled={!workspace || !selectedBranch || selectedBranch === currentBranch}
                        >
                            Switch
                        </Button>
                    </div>
                </FormGroup>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button intent="primary" onClick={handleBranch} disabled={!workspace || !branchName.trim()}>Branch</Button>
                </div>
            </div>
        </Dialog>
    );
}); 