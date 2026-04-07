import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { translate } from "@studio/shared/i18n";
import {   Button, Box, Input } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { getComments, addComment, removeComment, updateComment } from "../../../extra";
import { COLORS } from "../../../constants";
import { getInfo } from "../../../../../shared/services";
import CollapsePanel from "../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../property-types";

import styles from "./comments.module.css";

const avatarColor: Record<string, any> = {};

// here we have used colors
const getColor = () => {
  const no = Math.round(Math.random() * 10) % COLORS.length;
  const values = Object.values(avatarColor) || [];
  if (values.includes(COLORS[no])) {
    if (values.length === COLORS.length || values.includes("gray")) {
      return "gray";
    }
    getColor();
  } else {
    return COLORS[no];
  }
};

const getAvatarColor = (id: any) => {
  if (avatarColor[id]) return avatarColor[id];
  const color = getColor();
  if (color) {
    return (avatarColor[id] = color);
  }
};

export default function Comments({ element, updateCommentsCount }: PropertiesPanelComponentProps) {
  const [comment, setComment] = useState("");
  const [editComment, setEditComment] = useState<any>(null);
  const [comments, setComments] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const getCommentGroups = (comments: any) => {
    const groups = comments.reduce((groups: any, game: any) => {
      const date = game[1];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push([...game, false]);
      return groups;
    }, {});
    return groups;
  };

  const addNewComment = () => {
    addComment(
      element,
      user,
      dayjs().format("DD/MM/YYYY"),
      dayjs().format("HH.mm"),
      comment,
      nanoid(),
    );
    const comments = getComments(element);
    setComments(getCommentGroups(comments));
    setComment("");
    updateCommentsCount!(true);
  };

  const updateEdit = (key: any, id: any, value: any, valueIndex: any) => {
    const cloneElements = { ...comments };
    const index = cloneElements[key].findIndex((f: any) => f.includes(id));
    if (index > -1) {
      cloneElements[key][index][valueIndex] = value;
      setComments(cloneElements);
    }
  };

  const removeNewComment = (key: any, id: any) => {
    const cloneElements = { ...comments };
    const index = cloneElements[key].findIndex((f: any) => f.includes(id));
    if (index > -1) {
      cloneElements[key].splice(index, 1);
      if (cloneElements[key]?.length === 0) {
        delete cloneElements[key];
      }
      setComments(cloneElements);
    }
  };

  const renderKey = (key: any) => {
    if (key === dayjs().format("DD/MM/YYYY")) {
      return "Today";
    } else if (key === dayjs().subtract(1, "days").format("DD/MM/YYYY")) {
      return "Yesterday";
    } else {
      return key;
    }
  };

  useEffect(() => {
    async function getUser() {
      const info = await getInfo();
      setUser(info?.user?.name || "");
    }
    getUser();
  }, []);

  useEffect(() => {
    const comments = getComments(element);
    setComments(getCommentGroups(comments));
  }, [element]);

  return (
    <CollapsePanel
      open={false}
      label={translate("Comments")}
      badgeCount={Object.keys(comments || {})?.length}
      hideBadgeOnOpen={true}
    >
      {comments && Object.keys(comments).length === 0 && (
        <Box color="body" d="flex" alignItems="center">
          <div style={{ marginRight: 20 }}>
            <MaterialIcon icon="add_comment" fontSize={25} />
          </div>
          <div>
            <div className={styles.groupLabel}>{translate("Add comments")}</div>
            <div className={styles.sublabel}>
              {translate("You can add comments about diagrams or specific BPMN elements.")}
            </div>
          </div>
        </Box>
      )}
      <div>
        <div className={styles.reply}>
          <div className={styles.commentBox}>
            <Input
              as="textarea"
              placeholder={translate("Write your comment here")}
              onChange={(e: any) => setComment(e.target.value)}
              value={comment}
              rows={2}
            />
            <Button
              size="sm"
              variant="primary"
              className={styles.icon}
              onClick={addNewComment}
              disabled={!(comment || "").trim()}
            >
              {translate("Post")}
            </Button>
          </div>
          <div className={styles.comments}>
            {comments &&
              Object.entries(comments).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <Box color="body" className={styles.label}>
                    {renderKey(key)}
                  </Box>
                  <div>
                    {value?.length > 0 &&
                      value?.map((c: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            margin: "10px 0px",
                          }}
                        >
                          <div style={{ marginRight: 10 }}>
                            <Box
                              d="flex"
                              position="relative"
                              alignItems="center"
                              className={styles.small}
                              style={{
                                background: getAvatarColor(c && c[0] && c[0].charAt(0)),
                              }}
                            >
                              {c && c[0] && c[0].charAt(0)}
                            </Box>
                          </div>
                          <div style={{ width: "calc(100% - 85px)" }}>
                            <Box color="body">
                              <Box d="flex" alignItems="center">
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    fontSize: 14,
                                    marginRight: 20,
                                  }}
                                >
                                  {(c && c[0]) || "Admin"}
                                </div>
                                <div>{c && c[2] && c[2].replace(".", ":")}</div>
                              </Box>
                              {c && c[5] ? (
                                <React.Fragment>
                                  <Input
                                    as="textarea"
                                    onChange={(e: any) => setEditComment(e.target.value)}
                                    defaultValue={c && c[3]}
                                    placeholder={translate("Comment")}
                                    rows={1}
                                  />
                                  <Button
                                    className={styles.buttons}
                                    variant="primary"
                                    onClick={() => {
                                      updateEdit(key, c && c[4], false, 5);
                                      updateEdit(key, c && c[4], editComment, 3);
                                      updateComment(element, c, editComment);
                                    }}
                                  >
                                    {translate("Update comment")}
                                  </Button>
                                  <Button
                                    className={styles.buttons}
                                    variant="primary"
                                    onClick={() => {
                                      updateEdit(key, c && c[4], false, 5);
                                    }}
                                  >
                                    {translate("Cancel")}
                                  </Button>
                                </React.Fragment>
                              ) : (
                                <div
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "break-word",
                                  }}
                                >
                                  {c && c[3]}
                                </div>
                              )}
                            </Box>
                          </div>
                          <Box color="body" d="flex" alignItems="center">
                            <Button
                              size="sm"
                              variant="light"
                              className={styles.icon}
                              onClick={() => updateEdit(key, c && c[4], true, 5)}
                            >
                              <MaterialIcon icon="edit" fontSize={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              className={styles.icon}
                              onClick={() => {
                                removeNewComment(key, c && c[4]);
                                removeComment(element, c);
                                updateCommentsCount!(false);
                              }}
                            >
                              <MaterialIcon icon="delete" fontSize={16} />
                            </Button>
                          </Box>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </CollapsePanel>
  );
}
