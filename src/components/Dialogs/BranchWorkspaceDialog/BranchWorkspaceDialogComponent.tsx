import * as React from "react";
import { useEffect,useState } from "react";
import { Button, Classes, Dialog, FormGroup,InputGroup, Tooltip } from "@blueprintjs/core";
import { observer } from "mobx-react";

import { AppStore, DialogId, DialogStore } from "stores";

export const BranchWorkspaceDialogComponent = observer(() => {
    const appStore = AppStore.Instance;
    const dialogStore = DialogStore.Instance;
    const [branchName, setBranchName] = useState("");
    const isOpen = dialogStore.dialogVisible.get(DialogId.BranchWorkspace);
    const workspace = appStore.activeWorkspace;
    const [branches, setBranches] = useState<string[]>([]);
    const [currentBranch, setCurrentBranch] = useState<string>("");

    useEffect(() => {
        async function fetchBranches() {
            if (workspace) {
                const branchInfo = await appStore.listWorkspaceBranches(workspace.name);
                setBranches(branchInfo?.branches || []);
                setCurrentBranch(branchInfo?.current || "");
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

    const handleSwitchBranch = async (branchToSwitch: string) => {
        if (!workspace || !branchToSwitch || branchToSwitch === currentBranch) return;
        const success = await appStore.switchWorkspaceBranch(workspace.name, branchToSwitch);
        if (success) {
            // Refresh branch info after switching
            const branchInfo = await appStore.listWorkspaceBranches(workspace.name);
            setBranches(branchInfo?.branches || []);
            setCurrentBranch(branchInfo?.current || "");
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
                    <div style={{ padding: '8px 0', fontWeight: 500 }}>{workspace?.name || ""}</div>
                </FormGroup>
                <FormGroup label="Branch Name" helperText="Enter a name for the new branch.">
                    <InputGroup
                        value={branchName}
                        onChange={e => setBranchName(e.currentTarget.value)}
                        placeholder="Branch name"
                        autoFocus
                    />
                </FormGroup>
                <FormGroup label="Branches">
                    <div>
                        {branches.map(branch => (
                            <div key={branch} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                                <span
                                    style={{
                                        fontWeight: branch === currentBranch ? "bold" : "normal",
                                        color: branch === currentBranch ? "#137cbd" : undefined,
                                        flex: 1,
                                    }}
                                >
                                    {branch}
                                    {branch === currentBranch && " (current)"}
                                </span>
                                {branch !== currentBranch && (
                                    <Tooltip content="Delete branch">
                                        <Button
                                            icon="trash"
                                            minimal
                                            intent="danger"
                                            style={{ marginLeft: 8 }}
                                            onClick={async () => {
                                                if (window.confirm(`Delete branch "${branch}"? This cannot be undone.`)) {
                                                    await appStore.deleteWorkspaceBranch(workspace.name, branch);
                                                    // Refresh branch list
                                                    const branchInfo = await appStore.listWorkspaceBranches(workspace.name);
                                                    setBranches(branchInfo?.branches || []);
                                                    setCurrentBranch(branchInfo?.current || "");
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                )}
                                {branch !== currentBranch && (
                                    <Button
                                        style={{ marginLeft: 8 }}
                                        intent="primary"
                                        text="Switch"
                                        onClick={async () => {
                                            await handleSwitchBranch(branch);
                                        }}
                                        disabled={!workspace || branch === currentBranch}
                                    />
                                )}
                            </div>
                        ))}
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