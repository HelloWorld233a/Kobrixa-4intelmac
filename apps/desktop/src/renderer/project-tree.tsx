import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import type { WorkspaceEntry } from "../shared/api.js";
import {
  buildFileTree,
  flattenFileTree,
  pathContains,
  pathName,
  pathParent,
  treeListNavigation,
  type FileTreeNode,
} from "./file-tree.js";

export interface ProjectTreeCopy {
  treeLabel: string;
  newFile: string;
  newFolder: string;
  moreActions: string;
  rename: string;
  move: string;
  trash: string;
  expand: string;
  collapse: string;
}

interface ProjectTreeProps {
  rootLabel: string;
  entries: WorkspaceEntry[];
  activeFile: string | undefined;
  buildEntry: string | undefined;
  selectedPath: string;
  expandedPaths: ReadonlySet<string>;
  busy: boolean;
  copy: ProjectTreeCopy;
  onSelectedPath(path: string): void;
  onExpandedPaths(paths: Set<string>): void;
  onOpenFile(path: string): void;
  onCreate(kind: WorkspaceEntry["kind"], parent: string): void;
  onRename(source: string, name: string): Promise<boolean>;
  onMoveRequest(source: string): void;
  onMove(source: string, target: string): Promise<void>;
  onTrash(source: string): void;
}

export interface ProjectTreeHandle {
  focus(entryPath: string): void;
}

interface ContextMenuState {
  path: string;
  x: number;
  y: number;
}

function fileBadge(entryPath: string): string {
  return entryPath.toLocaleLowerCase("en-US").endsWith(".json") ? "{}" : "BP";
}

export const ProjectTree = forwardRef<ProjectTreeHandle, ProjectTreeProps>(function ProjectTree(
  {
    rootLabel,
    entries,
    activeFile,
    buildEntry,
    selectedPath,
    expandedPaths,
    busy,
    copy,
    onSelectedPath,
    onExpandedPaths,
    onOpenFile,
    onCreate,
    onRename,
    onMoveRequest,
    onMove,
    onTrash,
  },
  handleRef,
): React.JSX.Element {
  const root = useMemo(() => buildFileTree(rootLabel, entries), [entries, rootLabel]);
  const visible = useMemo(() => flattenFileTree(root, expandedPaths), [expandedPaths, root]);
  const allNodes = useMemo(() => {
    const result = new Map<string, FileTreeNode>();
    const visit = (node: FileTreeNode): void => {
      result.set(node.path, node);
      node.children.forEach(visit);
    };
    visit(root);
    return result;
  }, [root]);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const moreButton = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [renamingPath, setRenamingPath] = useState<string>();
  const [renameValue, setRenameValue] = useState("");
  const [menu, setMenu] = useState<ContextMenuState>();
  const draggingPath = useRef<string | undefined>(undefined);
  const [dropPath, setDropPath] = useState<string>();

  const selectedNode = allNodes.get(selectedPath) ?? root;
  const creationParent =
    selectedNode.kind === "directory" ? selectedNode.path : pathParent(selectedNode.path);

  useImperativeHandle(handleRef, () => ({
    focus: (entryPath) => itemRefs.current.get(entryPath)?.focus(),
  }));

  useEffect(() => {
    if (!menu) return undefined;
    const dismiss = (): void => setMenu(undefined);
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("blur", dismiss);
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("blur", dismiss);
    };
  }, [menu]);

  useEffect(() => {
    if (allNodes.has(selectedPath)) return;
    onSelectedPath("");
  }, [allNodes, onSelectedPath, selectedPath]);

  useEffect(() => {
    itemRefs.current.get(selectedPath)?.scrollIntoView({ block: "nearest" });
  }, [selectedPath]);

  useEffect(() => {
    if (menu)
      window.requestAnimationFrame(() =>
        menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus(),
      );
  }, [menu]);

  function toggle(node: FileTreeNode): void {
    if (node.kind !== "directory") return;
    const next = new Set(expandedPaths);
    if (next.has(node.path)) next.delete(node.path);
    else next.add(node.path);
    onExpandedPaths(next);
  }

  function select(entryPath: string, focus = false): void {
    onSelectedPath(entryPath);
    if (focus) window.requestAnimationFrame(() => itemRefs.current.get(entryPath)?.focus());
  }

  function protectedEntry(entryPath: string): boolean {
    return entryPath === "" || entryPath === "kobrixa.json";
  }

  function deletable(entryPath: string): boolean {
    return !protectedEntry(entryPath) && !(buildEntry && pathContains(entryPath, buildEntry));
  }

  function startRename(entryPath: string): void {
    if (busy || protectedEntry(entryPath)) return;
    setMenu(undefined);
    select(entryPath);
    setRenamingPath(entryPath);
    setRenameValue(pathName(entryPath));
  }

  function cancelRename(): void {
    const entryPath = renamingPath;
    setRenamingPath(undefined);
    if (entryPath !== undefined) {
      window.requestAnimationFrame(() => itemRefs.current.get(entryPath)?.focus());
    }
  }

  async function submitRename(): Promise<void> {
    if (!renamingPath) return;
    const name = renameValue.trim();
    if (!name || name === pathName(renamingPath)) {
      cancelRename();
      return;
    }
    const target = pathParent(renamingPath) ? `${pathParent(renamingPath)}/${name}` : name;
    if (await onRename(renamingPath, name)) {
      setRenamingPath(undefined);
      window.requestAnimationFrame(() => itemRefs.current.get(target)?.focus());
    }
  }

  function openMenu(entryPath: string, x: number, y: number): void {
    select(entryPath);
    setMenu({ path: entryPath, x, y });
  }

  function handleMenuKey(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(undefined);
      itemRefs.current.get(selectedPath)?.focus();
      return;
    }
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End"
    )
      return;
    const buttons = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []),
    ];
    if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (Math.max(0, current) + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) %
            buttons.length;
    buttons[next]?.focus();
  }

  function openKeyboardMenu(entryPath: string): void {
    const bounds = itemRefs.current.get(entryPath)?.getBoundingClientRect();
    openMenu(entryPath, bounds?.left ?? 16, bounds?.bottom ?? 16);
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>, node: FileTreeNode): void {
    if (event.target instanceof HTMLInputElement) return;
    let nextPath: string | undefined;
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      nextPath = treeListNavigation(
        visible.map((item) => item.path),
        node.path,
        event.key,
      );
    } else if (event.key === "ArrowRight" && node.kind === "directory") {
      if (!expandedPaths.has(node.path)) toggle(node);
      else nextPath = node.children[0]?.path;
    } else if (event.key === "ArrowLeft") {
      if (node.kind === "directory" && expandedPaths.has(node.path)) toggle(node);
      else nextPath = node.parent;
    } else if (event.key === "Enter" || event.key === " ") {
      if (node.kind === "directory") toggle(node);
      else onOpenFile(node.path);
    } else if (event.key === "F2") startRename(node.path);
    else if (event.key === "Delete" && deletable(node.path)) onTrash(node.path);
    else if (event.key === "F10" && event.shiftKey) openKeyboardMenu(node.path);
    else if (event.key === "Escape") {
      setRenamingPath(undefined);
      setMenu(undefined);
      return;
    } else return;
    event.preventDefault();
    event.stopPropagation();
    if (nextPath !== undefined) select(nextPath, true);
  }

  function beginDrag(event: DragEvent<HTMLDivElement>, entryPath: string): void {
    if (protectedEntry(entryPath)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-kobrixa-path", entryPath);
    draggingPath.current = entryPath;
  }

  function allowDrop(event: DragEvent<HTMLDivElement>, node: FileTreeNode): void {
    const source = draggingPath.current;
    if (!source || node.kind !== "directory" || pathContains(source, node.path)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropPath(node.path);
  }

  async function drop(event: DragEvent<HTMLDivElement>, node: FileTreeNode): Promise<void> {
    event.preventDefault();
    const source = event.dataTransfer.getData("application/x-kobrixa-path") || draggingPath.current;
    setDropPath(undefined);
    draggingPath.current = undefined;
    if (!source || node.kind !== "directory" || pathContains(source, node.path)) return;
    const target = node.path ? `${node.path}/${pathName(source)}` : pathName(source);
    if (target !== source) await onMove(source, target);
  }

  function renderNode(node: FileTreeNode, depth: number): React.JSX.Element {
    const expanded = node.kind === "directory" && expandedPaths.has(node.path);
    const selected = selectedPath === node.path;
    const active = activeFile === node.path;
    const isDropTarget = dropPath === node.path;
    return (
      <div
        aria-expanded={node.kind === "directory" ? expanded : undefined}
        aria-selected={selected}
        className="tree-item-shell"
        key={node.path || "root"}
        role="treeitem"
        tabIndex={selected ? 0 : -1}
        ref={(element) => {
          if (element) itemRefs.current.set(node.path, element);
          else itemRefs.current.delete(node.path);
        }}
        onKeyDown={(event) => handleKey(event, node)}
      >
        <div
          className={`tree-row ${selected ? "selected" : ""} ${active ? "active" : ""} ${
            isDropTarget ? "drop-target" : ""
          }`}
          draggable={!busy && !protectedEntry(node.path)}
          style={{ "--tree-depth": depth } as CSSProperties}
          title={node.path || rootLabel}
          onClick={() => {
            select(node.path, true);
            if (node.kind === "file") onOpenFile(node.path);
          }}
          onDoubleClick={() => node.kind === "directory" && toggle(node)}
          onContextMenu={(event) => {
            event.preventDefault();
            openMenu(node.path, event.clientX, event.clientY);
          }}
          onDragStart={(event) => beginDrag(event, node.path)}
          onDragEnd={() => {
            draggingPath.current = undefined;
            setDropPath(undefined);
          }}
          onDragOver={(event) => allowDrop(event, node)}
          onDragLeave={() => setDropPath((value) => (value === node.path ? undefined : value))}
          onDrop={(event) => void drop(event, node)}
        >
          {node.kind === "directory" ? (
            <button
              aria-label={`${expanded ? copy.collapse : copy.expand}: ${node.name}`}
              className="tree-chevron"
              tabIndex={-1}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggle(node);
              }}
            >
              {expanded ? "⌄" : "›"}
            </button>
          ) : (
            <span className="tree-chevron-spacer" />
          )}
          <span className={`tree-kind ${node.kind}`} aria-hidden="true">
            {node.kind === "directory" ? (expanded ? "▾" : "▸") : fileBadge(node.path)}
          </span>
          {renamingPath === node.path ? (
            <input
              autoFocus
              aria-label={copy.rename}
              className="tree-rename"
              value={renameValue}
              onBlur={() => setRenamingPath(undefined)}
              onChange={(event) => setRenameValue(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submitRename();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  cancelRename();
                }
              }}
            />
          ) : (
            <span className="tree-name">{node.name}</span>
          )}
        </div>
        {node.kind === "directory" && expanded && node.children.length > 0 && (
          <div role="group">{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  }

  const menuNode = menu ? allNodes.get(menu.path) : undefined;
  const canManageMenuNode = menuNode && !protectedEntry(menuNode.path);

  return (
    <>
      <div className="tree-toolbar">
        <div className="tree-toolbar-actions">
          <button
            aria-label={copy.newFile}
            disabled={busy}
            title={copy.newFile}
            type="button"
            onClick={() => onCreate("file", creationParent)}
          >
            +F
          </button>
          <button
            aria-label={copy.newFolder}
            disabled={busy}
            title={copy.newFolder}
            type="button"
            onClick={() => onCreate("directory", creationParent)}
          >
            +▰
          </button>
          <button
            aria-label={copy.moreActions}
            disabled={busy}
            ref={moreButton}
            title={copy.moreActions}
            type="button"
            onClick={() => {
              const bounds = moreButton.current?.getBoundingClientRect();
              openMenu(selectedNode.path, bounds?.left ?? 16, bounds?.bottom ?? 16);
            }}
          >
            ⋯
          </button>
        </div>
      </div>
      <div aria-label={copy.treeLabel} className="project-tree" role="tree">
        {renderNode(root, 0)}
      </div>
      {menu && menuNode && (
        <div
          className="tree-context-menu"
          ref={menuRef}
          role="menu"
          style={{ left: menu.x, top: menu.y }}
          onKeyDown={handleMenuKey}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {menuNode.kind === "directory" && (
            <>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenu(undefined);
                  onCreate("file", menuNode.path);
                }}
              >
                {copy.newFile}
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenu(undefined);
                  onCreate("directory", menuNode.path);
                }}
              >
                {copy.newFolder}
              </button>
            </>
          )}
          <button
            disabled={!canManageMenuNode}
            role="menuitem"
            type="button"
            onClick={() => startRename(menuNode.path)}
          >
            {copy.rename}
            <kbd>F2</kbd>
          </button>
          <button
            disabled={!canManageMenuNode}
            role="menuitem"
            type="button"
            onClick={() => {
              setMenu(undefined);
              onMoveRequest(menuNode.path);
            }}
          >
            {copy.move}
          </button>
          <button
            className="danger"
            disabled={!deletable(menuNode.path)}
            role="menuitem"
            type="button"
            onClick={() => {
              setMenu(undefined);
              onTrash(menuNode.path);
            }}
          >
            {copy.trash}
            <kbd>Del</kbd>
          </button>
        </div>
      )}
    </>
  );
});
