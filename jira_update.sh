echo $JIRA_USERNAME
echo $JIRA_PASSWORD
echo $JIRA_TICKET

curl -D- -u $JIRA_USERNAME:$JIRA_PASSWORD -X POST -H "X-Atlassian-Token: nocheck" -F "file=@coverage.zip" https://kickdrum.atlassian.net/rest/api/2/issue/$JIRA_TICKET/attachments