import * as React from "react";
import { useEffect,useState } from "react";
import { Button, Classes, Dialog, FormGroup,InputGroup } from "@blueprintjs/core";
import { observer } from "mobx-react";

import { AppStore, DialogId, DialogStore } from "stores";

export const SaveWorkspaceDialogComponent = observer(() => {
    const appStore = AppStore.Instance;
    const dialogStore = DialogStore.Instance;
    const [commitMessage, setCommitMessage] = useState("");
    const isOpen = dialogStore.dialogVisible.get(DialogId.SaveWorkspace);
    const workspace = appStore.activeWorkspace;
    //const [currentBranch, setCurrentBranch] = useState<string>(appStore.currentWorkspaceBranch || "master");
    //const currentBranch = appStore.currentWorkspaceBranch || "master";

    useEffect(() => {
        async function fetchBranch() {
            if (workspace?.name) {
                const branchInfo = await appStore.listWorkspaceBranches(workspace.name, appStore.currentWorkspaceBranch);
                //setCurrentBranch(branchInfo?.current || currentBranch );
                // Update the global branch if backend returns something different:
                if (branchInfo?.current && branchInfo.current !== appStore.currentWorkspaceBranch) {
                    appStore.setCurrentWorkspaceBranch(branchInfo.current);
                }
            }
        }
        if (isOpen && workspace?.name) {
            fetchBranch();
        }
    }, [isOpen, workspace?.name, appStore]);

    const handleClose = () => {
        dialogStore.hideDialog(DialogId.SaveWorkspace);
        setCommitMessage("");
    };

    const handleSave = async () => {
        if (workspace) {
            const result = await appStore.saveWorkspace(workspace.name, commitMessage, appStore.currentWorkspaceBranch);
            if (result) {
                // Show success toast
                const { AppToaster, SuccessToast } = await import("../../Shared");
                AppToaster.show(SuccessToast("floppy-disk", "Workspace saved successfully."));
            }
        }
        handleClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            title="Save Workspace"
            canEscapeKeyClose
            canOutsideClickClose
            className={Classes.DIALOG}
        >
            <div className={Classes.DIALOG_BODY}>
                <FormGroup label="Workspace Name">
                    <div style={{ padding: '8px 0', fontWeight: 500 }}>{workspace?.name || ""}</div>
                    {appStore.currentWorkspaceBranch  && (
                        <div style={{ fontSize: '0.9em', fontStyle: 'italic', color: '#888' }}>
                            Experiment: <b>{appStore.currentWorkspaceBranch.replace(/^[^a-zA-Z0-9]+/, '').trim() }</b>
                        </div>
                    )}
                </FormGroup>
                <FormGroup label="Note (optional)">
                    <InputGroup
                        value={commitMessage}
                        onChange={e => setCommitMessage(e.currentTarget.value)}
                        placeholder="Enter a note"
                    />
                </FormGroup>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button intent="primary" onClick={handleSave} disabled={!workspace || !workspace.editable}>Save</Button>
                </div>
            </div>
        </Dialog>
    );
}); 