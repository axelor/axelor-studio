import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Block, Menu, MenuItem, useClassNames } from "@axelor/ui";
import { translate as _t } from "@studio/shared/i18n";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { getCollaborationService } from "../services/collaboration.service";
import { useStore } from "../store";

import styles from "./collaboration.module.scss";
import Avatar from "./Avatar";


dayjs.extend(relativeTime);

interface CollaborationUser {
  id: string | number;
  code: string;
  [key: string]: unknown;
}

interface UserState {
  dirty?: boolean;
  dirtyDate?: dayjs.ConfigType;
  joinDate?: dayjs.ConfigType;
  leftDate?: dayjs.ConfigType;
  version?: number;
  versionDate?: dayjs.ConfigType;
  [key: string]: unknown;
}

export const Collaboration = () => {
  const { state } = useStore();
  const dirty = (state?.dirty as boolean) ?? false;
  const record = (state?.record as Record<string, unknown>) ?? null;
  const info = (state?.info ?? {});
  const user = (info?.user ?? {}) as Record<string, unknown>;
  const view = (info?.view ?? {}) as Record<string, unknown>;
  const canView = (user?.canViewCollaboration as boolean) ?? true;
  const collaboration = (view?.collaboration ?? {}) as Record<string, unknown>;
  const enabled = (collaboration?.enabled as boolean) ?? true;

  return (
    canView &&
    enabled &&
    record !== null &&
    record && (
      <CollaborationContainer
        model="com.axelor.studio.db.WkfModel"
        recordId={record?.id as string | number}
        recordVersion={record?.version as number}
        canView={canView}
        dirty={dirty}
      />
    )
  );
};

interface CollaborationContainerProps {
  model: string;
  recordId: string | number;
  recordVersion: number;
  canView: boolean;
  dirty?: boolean;
}

const CollaborationContainer = memo(
  ({ model, recordId, recordVersion, canView, dirty = false }: CollaborationContainerProps) => {
    const collaborationService = useMemo(() => getCollaborationService(), []);
    const [users, setUsers] = useState<CollaborationUser[]>([]);
    const [states, setStates] = useState<Record<string, UserState>>({});

    const classNames = useClassNames();

    useEffect(() => {
      return collaborationService.joinRoom(
        { model, recordId, recordVersion: 0, dirty: false },
        (room) => {
          setUsers(room.users);
          setStates(room.states);
        },
      );
    }, [collaborationService, model, recordId]);

    useEffect(() => {
      collaborationService.updateRoom({
        model,
        recordId,
        recordVersion,
        dirty,
      });
    }, [collaborationService, model, recordId, recordVersion, dirty]);

    if (!canView || users?.length <= 1) {
      return null;
    }

    return (
      <Box className={classNames(styles.viewCollaboration)}>
        <Users recordVersion={recordVersion} users={users} states={states} />
      </Box>
    );
  },
);

interface UsersProps {
  recordVersion: number;
  users: CollaborationUser[];
  states: Record<string, UserState>;
}

function Users({ recordVersion, users, states }: UsersProps) {
  const sessionUser = useSessionUser();
  const otherUsers = useMemo(
    () => users.filter((user) => user.id !== sessionUser?.id),
    [users, sessionUser],
  );

  const avatarLimit = 3;

  const [inlineUsers, groupedUsers] = useMemo(() => {
    if (avatarLimit <= 0) {
      return [[], []];
    }
    if (otherUsers.length <= avatarLimit) {
      return [otherUsers, []];
    }
    const limit = avatarLimit - 1;
    return [otherUsers.slice(0, limit), otherUsers.slice(limit)];
  }, [otherUsers, avatarLimit]);

  const getClassName = useCallback(
    (state: UserState) => {
      if (state.leftDate) {
        return "left";
      }
      if ((state.version ?? 0) > recordVersion && state.versionDate) {
        return "saved";
      }
      if (state.dirty) {
        return "dirty";
      }
      return "joined";
    },
    [recordVersion],
  );

  const getTitle = useCallback((className: string, userName: string | null, state: UserState, _currentDate = "") => {
    if (className === "left") {
      return _t(`${userName} left ${formatDate(state.versionDate)}`);
    }
    if (className === "saved") {
      return _t(`${userName} saved ${formatDate(state.versionDate)}`);
    }
    if (className === "dirty") {
      return _t(`${userName} is editing since ${formatDate(state.dirtyDate)}`);
    }
    return _t(`${userName} joined ${formatDate(state.joinDate)}`);
  }, []);

  return (
    <Box d="flex" flexDirection="row" gap="2">
      {inlineUsers.map((user) => (
        <SingleUser
          key={user.id}
          user={user}
          state={states[user.code]}
          getClassName={getClassName}
          getTitle={getTitle}
        />
      ))}
      {groupedUsers.length ? (
        <GroupedUsers
          users={groupedUsers}
          states={states}
          isAll={!inlineUsers.length}
          getClassName={getClassName}
          getTitle={getTitle}
        />
      ) : null}
    </Box>
  );
}

interface SingleUserProps {
  user: CollaborationUser;
  state?: UserState;
  getClassName: (state: UserState) => string;
  getTitle: (className: string, userName: string | null, state: UserState, currentDate?: string) => string;
  withUserName?: boolean;
}

function SingleUser({ user, state = {} as UserState, getClassName, getTitle, withUserName = false }: SingleUserProps) {
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const classNames = useClassNames();
  const userName = useUserName(user);
  const className = useMemo(() => getClassName(state), [getClassName, state]);
  const title = useMemo(
    () => getTitle(className, userName, state, currentDate),
    [getTitle, className, userName, state, currentDate],
  );

  const handleMouseEnter = useCallback(() => setCurrentDate(getCurrentDate()), [setCurrentDate]);

  if (withUserName) {
    return (
      <Box d="flex" alignItems="center" title={title} onMouseEnter={handleMouseEnter}>
        <Box d="flex" alignItems="center" pe={2}>
          <Box className={classNames(styles.avatarContainer, styles[className])}>
            <Avatar user={user} title={title} className={classNames(styles.avatar)} />
          </Box>
        </Box>
        <span>{userName}</span>
      </Box>
    );
  }

  return (
    <Box
      title={title}
      onMouseEnter={handleMouseEnter}
      className={classNames(styles.avatarContainer, styles[className])}
    >
      <Avatar user={user} title={title} className={classNames(styles.avatar)} />
    </Box>
  );
}

interface GroupedUsersProps {
  users?: CollaborationUser[];
  states?: Record<string, UserState>;
  getClassName: (state: UserState) => string;
  getTitle: (className: string, userName: string | null, state: UserState, currentDate?: string) => string;
  isAll?: boolean;
}

function GroupedUsers({ users = [], states = {}, getClassName, getTitle, isAll = false }: GroupedUsersProps) {
  const classNames = useClassNames();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const openMenu = useCallback((event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget), [setAnchorEl]);
  const closeMenu = useCallback(() => setAnchorEl(null), [setAnchorEl]);

  const firstUser = useMemo(
    () => (users.length > 0 ? users[0] : { id: "", code: "" } as CollaborationUser),
    [users],
  );
  const firstState = states[firstUser.code];
  const firstUserName = useUserName(firstUser);

  const className = useMemo(() => getClassName(firstState), [firstState, getClassName]);
  const [currentDate, setCurrentDate] = useState(() => getCurrentDate());
  const title = useMemo(
    () => getTitle(className, firstUserName, firstState, currentDate),
    [getTitle, className, firstUserName, firstState, currentDate],
  );
  const handleMouseEnter = useCallback(() => setCurrentDate(getCurrentDate()), [setCurrentDate]);
  const text = useMemo(() => `${isAll ? "" : "+"}${users.length}`, [isAll, users]);

  return (
    <Box>
      <Box
        title={title}
        onMouseEnter={handleMouseEnter}
        className={classNames(styles.avatarContainer, styles[className])}
      >
        <Block onClick={openMenu} className={classNames(styles.menu)}>
          <Avatar text={text} title={title} className={classNames(styles.avatar, styles.grouped)} />
        </Block>
      </Box>
      <Menu
        className={styles.viewCollaborationMenu}
        target={anchorEl}
        show={Boolean(anchorEl)}
        onHide={closeMenu}
      >
        {users.map((user) => {
          return (
            <MenuItem key={user.id} onClick={closeMenu}>
              <SingleUser
                key={user.id}
                user={user}
                state={states[user.code]}
                getClassName={getClassName}
                getTitle={getTitle}
                withUserName
              />
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}

function useSessionUser() {
  const { state } = useStore();
  const data = state.info;
  return useMemo(() => {
    const user = data?.user as Record<string, string> | undefined;
    if (!user) {
      return undefined;
    }
    const { id, login, name, nameField, image } = user;
    return {
      id,
      code: login,
      [nameField ?? "name"]: name,
      $avatar: image,
    };
  }, [data]);
}

function useUserName(user: CollaborationUser): string | null {
  const { state } = useStore();
  const info = (state?.info ?? {});
  const activeUser = (info?.user as Record<string, unknown>) ?? {};
  const nameField = (activeUser?.nameField as string) ?? "name";

  const userName = useMemo(() => {
    if (user && nameField in user) {
      return user[nameField] as string;
    } else {
      return null;
    }
  }, [user, nameField]);

  return userName;
}

function formatDate(date: dayjs.ConfigType) {
  return dayjs(date).fromNow();
}

function getCurrentDate() {
  return dayjs().format("YYYY-MM-DD HH:mm");
}
