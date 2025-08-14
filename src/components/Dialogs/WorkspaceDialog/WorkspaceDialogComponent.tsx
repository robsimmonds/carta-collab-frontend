import * as React from "react";
import {useCallback, useEffect, useState} from "react";
import {AnchorButton, Classes, Dialog,DialogProps, FormGroup,InputGroup, Intent, NonIdealState, Spinner} from "@blueprintjs/core";
import {Cell, Column, Region, RenderMode, SelectionModes, Table2, TableLoadingOption} from "@blueprintjs/table";
import classNames from "classnames";
import {observer} from "mobx-react";
import moment from "moment/moment";

import {DraggableDialogComponent} from "components/Dialogs";
import {WorkspaceListItem} from "models";
import {AlertStore, AppStore, DialogId, HelpType} from "stores";

import {AppToaster, ErrorToast, SuccessToast} from "../../Shared";

import {WorkspaceInfoComponent} from "./WorkspaceInfoComponent";

import "./WorkspaceDialogComponent.scss";

export enum WorkspaceDialogMode {
    Hidden,
    Save,
    Open,
    Create, //new create mode
    Clone,  //new mode for cloning
    Branch  //new mode for branching
}

export const WorkspaceDialogComponent = observer(() => {
    const [workspaceList, setWorkspaceList] = useState<WorkspaceListItem[]>();
    const [isFetching, setIsFetching] = useState(false);
    const [fetchErrorMessage, setFetchErrorMessage] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");
    const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceListItem>();
    const [commitMessage, setCommitMessage] = useState("");
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [currentBranch, setCurrentBranch] = useState<string>("");
    const [branchName, setBranchName] = useState("");
    const [branchGraph, setBranchGraph] = useState<any[]>([]);
    const [showGraph, setShowGraph] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState<any | null>(null);

    const appStore = AppStore.Instance;
    const mode = appStore.dialogStore.workspaceDialogMode;



    const fetchWorkspaces = useCallback(async () => {
        setIsFetching(true);
        setFetchErrorMessage("");

        try {
            const workspaces = await appStore.apiService.getWorkspaceList();
            setWorkspaceList(workspaces);
        } catch (err) {
            setFetchErrorMessage(err);
        }
        setIsFetching(false);
    }, [appStore]);

    const handleInput = (ev: React.FormEvent<HTMLInputElement>) => {
        setWorkspaceName(ev.currentTarget.value);
    };

    const handleKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.key === "Enter" && workspaceName) {
            handleSaveClicked();
        }
    };

    const handleCloseClicked = useCallback(() => {
        appStore.dialogStore.hideDialog(DialogId.Workspace);
        setWorkspaceName("");
        setWorkspaceList(undefined);
    }, [appStore]);

    
    // 1. create workspace logic
    const createWorkspace = useCallback(async (name: string) => {
        if (!name) return;
	setIsFetching(true);
	
	try {
	    // Calls a new store method that creates db and inits git
	    const res = await appStore.createWorkspace(name);
	    if (res) {
	        AppToaster.show(SuccessToast("floppy-disk", "Workspace created"));
		handleCloseClicked();
		return;
	    }
	} catch (err) {
	    console.log(err);
	}
	AppToaster.show(ErrorToast("Error creating workspace"));
	setIsFetching(false);
    }, [appStore, handleCloseClicked]);

    
    const handleCreateClicked = () => {
	if (!workspaceName) {
	    return;
	}
   	createWorkspace(workspaceName);
    };

    const saveWorkspace = useCallback(
        async (name: string, commitMsg?: string) => {
            if (!name) {
                return;
            }

            // TODO: to be removed after storing SystemType in workspace
            if (appStore.overlaySettings.isImgCoordinates && appStore.frames.map(frame => frame.spatialReference !== null).includes(true)) {
                AlertStore.Instance.showAlert("Saving workspace failed: not supporting spatial matching in image cooordinates.");
                return;
            }

            setIsFetching(true);
            try {
                const res = await appStore.saveWorkspace(name, commitMsg);
                if (res) {
                    AppToaster.show(SuccessToast("floppy-disk", "Workspace saved"));
                    handleCloseClicked();
                    return;
                }
            } catch (err) {
                console.log(err);
            }
            AppToaster.show(ErrorToast("Error saving workspace"));
            setIsFetching(false);
        },
        [appStore, handleCloseClicked]
    );

    // clone workspace logic
    const cloneWorkspace = useCallback(async (name: string) => {
        if (!name) return;
        setIsFetching(true);

        try {
            // Calls a new store method that creates db and inits git
            const res = await appStore.cloneWorkspace(name, branchName);
            if (res) {
                AppToaster.show(SuccessToast("floppy-disk", "Workspace cloned"));
                handleCloseClicked();
                return;
            }
        } catch (err) {
            console.log(err);
        }
        AppToaster.show(ErrorToast("Error cloning workspace"));
        setIsFetching(false);
    }, [appStore, handleCloseClicked]);    

    const handleCloneClicked = () => {
        if (!selectedWorkspace) {
            return;
        }
        cloneWorkspace(selectedWorkspace.name);
    };
      
/*    // branch workspace logic
    const branchWorkspace = useCallback(async (name: string) => {
        if (!name) return;
        setIsFetching(true);

        try {
            // Calls a new store method that creates db and inits git
            const res = await appStore.branchWorkspace(name);
            if (res) {
                AppToaster.show(SuccessToast("floppy-disk", "Workspace branched"));
                handleCloseClicked();
                return;
            }
        } catch (err) {
            console.log(err);
        }
        AppToaster.show(ErrorToast("Error cloning workspace"));
        setIsFetching(false);
    }, [appStore, handleCloseClicked]); */

    const handleBranchClicked = async () => {
	    //branchWorkspace(selectedWorkspace.name)
        if (!selectedWorkspace || !branchName) return;
        await appStore.branchWorkspace(selectedWorkspace.name, branchName);
        await fetchWorkspaces();
        
    };

    const openWorkspace = useCallback(
        async (name: string) => {
            if (!name) {
                return;
            }

            setIsFetching(true);
            try {
                const res = await appStore.loadWorkspace(name);
                if (res) {
                    AppToaster.show(SuccessToast("floppy-disk", "Workspace loaded"));
                    handleCloseClicked();
                    return;
                }
            } catch (err) {
                console.log(err);
            }
            setIsFetching(false);
        },
        [appStore, handleCloseClicked]
    );

    const handleSaveClicked = () => {
        if (!workspaceName) {
            return;
        }
        saveWorkspace(workspaceName, commitMessage);
    };

    const handleDeleteClicked = async () => {
        if (!selectedWorkspace) {
            return;
        }
        const confirmed = await appStore.alertStore.showInteractiveAlert("Are you sure you want to delete this workspace?");
        if (confirmed) {
            await appStore.deleteWorkspace(selectedWorkspace.name);
            await fetchWorkspaces();
        }
    };

    const handleOpenClicked = async () => {
        if (!workspaceName || !workspaceList.find(item => item.name === workspaceName)) {
            return;
        }
        // If a branch is selected and it's not the current branch, switch first
        if (selectedWorkspace && selectedBranch && selectedBranch !== currentBranch) {
            await appStore.switchWorkspaceBranch(selectedWorkspace.name, selectedBranch, currentBranch);
            // Refresh branch info after switching
            const branchInfo = await appStore.listWorkspaceBranches(selectedWorkspace.name);
            setBranches(branchInfo?.branches || []);
            setCurrentBranch(branchInfo?.current || "");
            setSelectedBranch(branchInfo?.current || "");
        }
        openWorkspace(workspaceName);
    };

    // Fetch workspaces at start
    useEffect(() => {
        setSelectedWorkspace(undefined);
        setIsFetching(false);
        if (mode !== WorkspaceDialogMode.Hidden) {
            fetchWorkspaces();
        }
    }, [mode, fetchWorkspaces]);

    const className = classNames("workspace-dialog", {[Classes.DARK]: appStore.darkTheme});

    const dialogProps: DialogProps = {
        icon: "control",
        backdropClassName: "minimal-dialog-backdrop",
        className: className,
        canOutsideClickClose: false,
        lazy: true,
        isOpen: mode !== WorkspaceDialogMode.Hidden,
        title: mode === WorkspaceDialogMode.Save
			? "Save Workspace" 
			: mode === WorkspaceDialogMode.Create
			? "Create Workspace"
			: mode === WorkspaceDialogMode.Clone
			? "Clone Workspace"
			: mode === WorkspaceDialogMode.Branch
			? "Branch Workspace"
			: "Open Workspace"
    };

    const handleEntryClicked = async (entry: WorkspaceListItem) => {
        setWorkspaceName(entry.name);
        setSelectedWorkspace(entry);

        if (entry.name) {
            const branchInfo = await appStore.listWorkspaceBranches(entry.name);
            setBranches(branchInfo?.branches || []);
            setCurrentBranch(branchInfo?.current || "");
            setSelectedBranch(branchInfo?.current || "");
        }
    };

    const handleDoubleClick = useCallback(
        (entry: WorkspaceListItem) => {
            if (!entry?.name) {
                return;
            }
            if (mode === WorkspaceDialogMode.Save) {
                saveWorkspace(entry.name);
            } else {
                openWorkspace(entry.name);
            }
        },
        [mode, saveWorkspace, openWorkspace]
    );

    const renderFilenames = useCallback(
        (rowIndex: number) => {
            const entry = workspaceList?.[rowIndex];
            if (!entry) {
                return <Cell loading={true} />;
            }
            return (
                <Cell className="filename-cell" tooltip={entry.name}>
                    <React.Fragment>
                        <div onClick={() => handleEntryClicked(entry)} onDoubleClick={() => handleDoubleClick(entry)}>
                            <span className="cell-text">{entry.name}</span>
                        </div>
                    </React.Fragment>
                </Cell>
            );
        },
        [workspaceList, handleDoubleClick]
    );

    const renderDates = useCallback(
        (rowIndex: number) => {
            const entry = workspaceList?.[rowIndex];
            if (!entry) {
                return <Cell loading={true} />;
            }

            const unixDate = entry.date;
            let dateString: string;
            if (unixDate > 0) {
                const t = moment.unix(unixDate);
                const isToday = moment(0, "HH").diff(t) <= 0;
                if (isToday) {
                    dateString = t.format("HH:mm");
                } else {
                    dateString = t.format("D MMM YYYY");
                }
            }

            return (
                <Cell className="time-cell">
                    <React.Fragment>
                        <div onClick={() => handleEntryClicked(entry)}>
                            <span className="cell-text">{dateString}</span>
                        </div>
                    </React.Fragment>
                </Cell>
            );
        },
        [workspaceList]
    );

    const selectedItemIndex = workspaceList?.findIndex(item => item.name === workspaceName);
    const selectedRegions: Region[] = selectedItemIndex >= 0 ? [{rows: [selectedItemIndex, selectedItemIndex]}] : [];

    let tableContent: React.ReactNode;
    if (isFetching) {
        tableContent = <NonIdealState icon={<Spinner intent="primary" />} title="Loading workspaces" />;
    } else if (fetchErrorMessage) {
        tableContent = <NonIdealState icon="error" title="Error" description={fetchErrorMessage} />;
    } else if (!workspaceList?.length) {
        tableContent = <NonIdealState icon="search" title="No results" description="There are no workspaces available" />;
    } else {
        tableContent = (
            <Table2
                className={classNames("workspace-table", {[Classes.DARK]: appStore.darkTheme})}
                enableRowReordering={false}
                renderMode={RenderMode.NONE}
                selectionModes={SelectionModes.ROWS_ONLY}
                selectedRegions={selectedRegions}
                enableGhostCells={false}
                enableMultipleSelection={false}
                enableRowResizing={false}
                columnWidths={[200, 120]}
                defaultRowHeight={22}
                enableRowHeader={false}
                numRows={workspaceList?.length}
                loadingOptions={isFetching ? [TableLoadingOption.CELLS] : []}
            >
                <Column name="Name" cellRenderer={renderFilenames} />
                <Column name="Last modified" cellRenderer={renderDates} />
            </Table2>
        );
    }

    const handleSwitchBranch = async () => {
        if (!selectedWorkspace || !selectedBranch) return;
        const success = await appStore.switchWorkspaceBranch(selectedWorkspace.name, selectedBranch, currentBranch);
        if (success) {
            AppToaster.show(SuccessToast("console", `Switched to branch ${selectedBranch}`));
            // Refresh branch info after switching
            const branchInfo = await appStore.listWorkspaceBranches(selectedWorkspace.name);
            setBranches(branchInfo?.branches || []);
            setCurrentBranch(branchInfo?.current || "");
            setSelectedBranch(branchInfo?.current || "");
            // Optionally reload workspace data
            await appStore.loadWorkspace(selectedWorkspace.name);
        }
    };

    const handleShowGraph = async () => {
        if (workspaceName) {
            const graph = await appStore.apiService.getWorkspaceTopology(workspaceName);
            setBranchGraph(graph);
            setShowGraph(true);
        }
    };

    return (
        <DraggableDialogComponent dialogProps={dialogProps} helpType={HelpType.WORKSPACE} defaultWidth={750} defaultHeight={550} minWidth={750} minHeight={550} enableResizing={true} dialogId={DialogId.Workspace}>
            <div className={Classes.DIALOG_BODY}>
                <div className="workspace-container">
                    <div className="workspace-table-container">{tableContent}</div>
                    <div className="workspace-info-container">{workspaceList?.length ? <WorkspaceInfoComponent workspaceListItem={selectedWorkspace} /> : null}</div>
                </div>
                <InputGroup className="workspace-name-input" placeholder="Enter workspace name" value={workspaceName} autoFocus={true} onChange={handleInput} onKeyDown={handleKeyDown} />
                {mode === WorkspaceDialogMode.Save && currentBranch && (
                    <div style={{ margin: "8px 0", fontStyle: "italic", color: "#888" }}>
                        Saving to branch: <b>{currentBranch}</b>
                    </div>
                )}
                {mode === WorkspaceDialogMode.Save && (
                    <InputGroup
                        className="workspace-commit-message-input"
                        placeholder="Enter commit message (optional)"
                        value={commitMessage}
                        onChange={e => setCommitMessage(e.currentTarget.value)}
                        style={{ marginTop: 8 }}
                    />
                )}
                {mode === WorkspaceDialogMode.Branch && selectedWorkspace && (
                    <div style={{ margin: "8px 0" }}>
                        <label>Switch Branch:</label>
                        <select
                            value={selectedBranch}
                            onChange={e => setSelectedBranch(e.target.value)}
                            style={{ marginLeft: 8, minWidth: 120 }}
                        >
                            {branches.map(branch => (
                                <option key={branch} value={branch}>
                                    {branch}
                                </option>
                            ))}
                        </select>
                        <AnchorButton
                            intent={Intent.PRIMARY}
                            onClick={handleSwitchBranch}
                            text="Switch"
                            disabled={isFetching || !selectedBranch}
                            style={{ marginLeft: 8 }}
                        />
                        {currentBranch && (
                            <span style={{ marginLeft: 16, fontStyle: "italic" }}>
                                Current: {currentBranch}
                            </span>
                        )}
                    </div>
                )}
                {mode === WorkspaceDialogMode.Open && selectedWorkspace && (
                    <div style={{ margin: "8px 0" }}>
                        <label>Open Branch:</label>
                        <select
                            value={selectedBranch}
                            onChange={e => setSelectedBranch(e.target.value)}
                            style={{ marginLeft: 8, minWidth: 120 }}
                        >
                            {branches.map(branch => (
                                <option key={branch} value={branch}>
                                    {branch}
                                </option>
                            ))}
                        </select>
                        {currentBranch && (
                            <span style={{ marginLeft: 16, fontStyle: "italic" }}>
                                Current: {currentBranch}
                            </span>
                        )}
                    </div>
                )}
                {mode === WorkspaceDialogMode.Branch && (
                    <FormGroup label="Branch Name" labelFor="branch-name-input">
                        <InputGroup
                            id="branch-name-input"
                            placeholder="Enter branch name"
                            value={branchName}
                            onChange={e => setBranchName(e.currentTarget.value)}
                        />
                    </FormGroup>
                )}
                {showGraph && (
                    <div style={{ maxHeight: 300, overflow: "auto", background: "#222", color: "#fff", fontFamily: "monospace" }}>
                        {branchGraph.map(commit => (
                            <div key={commit.hash}>
                                <b>{commit.hash.slice(0,7)}</b>
                                {" ← "}
                                {commit.parents.map(parent => (
                                    <span key={parent} style={{ color: "#aaa" }}>{parent.slice(0,7)} </span>
                                ))}
                                {commit.subject}
                                {commit.refs && (
                                    <span style={{ color: "#ffd700", marginLeft: 8 }}>
                                        {commit.refs.split(",").map(ref => (
                                            <span key={ref.trim()} style={{
                                                background: ref.includes(currentBranch) ? "#4caf50" : "#555",
                                                color: "#222",
                                                borderRadius: 4,
                                                padding: "0 4px",
                                                marginRight: 4
                                            }}>{ref.trim()}</span>
                                        ))}
                                    </span>
                                )}
                                <br/>
                                <small>{commit.author} &lt;{commit.email}&gt; {commit.date}</small>
                                {commit.parents.length > 1 && (
                                    <span style={{ color: "#f44336", marginLeft: 8 }}>[merge]</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <AnchorButton intent={Intent.DANGER} icon="trash" onClick={handleDeleteClicked} text="Delete" disabled={isFetching || !selectedWorkspace  || !appStore.activeWorkspace?.editable } />
                    {mode === WorkspaceDialogMode.Save && (
                        <AnchorButton intent={Intent.PRIMARY} onClick={handleSaveClicked} text="Save" disabled={isFetching || !workspaceName} />
                    )}

		    {mode === WorkspaceDialogMode.Open && (
                        <AnchorButton intent={Intent.PRIMARY} onClick={handleOpenClicked} text="Open" disabled={isFetching || !selectedRegions?.length} />
                    )}
		 
		    {/*CREATE*/}
		    {mode === WorkspaceDialogMode.Create && (
			<AnchorButton intent={Intent.PRIMARY} onClick={handleCreateClicked} text="Create" disabled={isFetching || !workspaceName} />
		    )}

		    {/*Clone*/}
                    {mode === WorkspaceDialogMode.Clone && (
                        <AnchorButton intent={Intent.PRIMARY} onClick={handleCloneClicked} text="Clone" disabled={isFetching || !workspaceName} /> 
                    )}
		    {/*Branch*/}
                    {mode === WorkspaceDialogMode.Branch && (
                        <AnchorButton intent={Intent.PRIMARY} onClick={handleBranchClicked} text="Branch" disabled={isFetching || !selectedWorkspace} /> 
                    )} 
                    <AnchorButton icon="git-branch" text="Show Branch Topology" onClick={handleShowGraph} />
	        </div>
            </div>
            <Dialog
                isOpen={!!selectedCommit}
                onClose={() => setSelectedCommit(null)}
                title={`Commit ${selectedCommit?.hash?.slice(0,7)}`}
            >
                {selectedCommit && (
                    <div style={{ fontFamily: "monospace" }}>
                        <div><b>Hash:</b> {selectedCommit.hash}</div>
                        <div><b>Author:</b> {selectedCommit.author} &lt;{selectedCommit.email}&gt;</div>
                        <div><b>Date:</b> {selectedCommit.date}</div>
                        <div><b>Branches/Tags:</b> {selectedCommit.refs}</div>
                        <div><b>Parents:</b> {selectedCommit.parents.join(", ")}</div>
                        <div><b>Subject:</b> {selectedCommit.subject}</div>
                        <div><b>Message:</b><pre>{selectedCommit.body}</pre></div>
                    </div>
                )}
            </Dialog>
        </DraggableDialogComponent>
    );
});
