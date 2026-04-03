# Deploying BharatBricks to Databricks Apps

This guide walks through creating and deploying the app manually from the Databricks UI, pointing the source to a Git repository.

---

## Prerequisites

1. **Databricks Workspace** with Apps enabled (free trial or paid)
2. **Git repository** with this source code pushed (e.g., GitHub)
3. **Unity Catalog Volume** at `/Volumes/bharatbricks/iiscb/datasets/arxiv/` with JSON files
4. **SQL Warehouse** accessible in the workspace
5. **Git credentials** configured in Databricks (if repo is private)

---

## Step 1: Configure Git Credentials (if private repo)

1. Go to **User Settings** (top-right avatar > Settings)
2. Navigate to **Linked accounts** > **Git integration**
3. Select your Git provider (GitHub, Azure DevOps, etc.)
4. Add a personal access token with repo read access

---

## Step 2: Create the Databricks App

1. In the Databricks workspace, navigate to **Compute** > **Apps** in the left sidebar
2. Click **Create App**
3. Fill in:
   - **App name**: `bharatbricks` (or your preferred name)
   - **Description**: `ArXiv Dataset Explorer for IISc Bangalore`

---

## Step 3: Configure Source Code from Git

1. In the app creation wizard, select **Source code** section
2. Choose **Git repository** as the source
3. Enter:
   - **Repository URL**: Your Git repo URL (e.g., `https://github.com/<user>/bharatbricks`)
   - **Branch**: `feature-beepz` (or whichever branch has the code)
   - **Path in repo**: `/` (root, since `app.yaml` is at the project root)
4. Click **Save**

---

## Step 4: Add App Resources

After creating the app, add the required resources:

### SQL Warehouse

1. In the app configuration, click **+ Add resource**
2. Select **SQL Warehouse**
3. Choose your SQL warehouse from the dropdown
4. Set the **Key** to: `sql-warehouse` (must match the `valueFrom` in `app.yaml`)
5. Set **Permission** to: `CAN USE`
6. Click **Save**

### Unity Catalog Volume (Optional - for SP access)

1. Click **+ Add resource** again
2. Select **Unity Catalog Volume**
3. Select the volume: `bharatbricks.iiscb.datasets`
4. Set the **Key** to: `volume`
5. Set **Permission** to: `CAN READ`
6. Click **Save**

> **Note**: The app's service principal needs `READ VOLUME` permission on the volume to list files. Adding the volume as a resource auto-grants this.

---

## Step 5: Enable User Authorization (OBO)

The app uses on-behalf-of (OBO) user auth to run SQL queries with the user's identity. This must be enabled:

1. In the app configuration, find **User authorization** section
2. Toggle **Enable user authorization** to ON
3. Add the required OAuth scopes:
   - `sql` - for executing SQL queries via the warehouse
   - `iam.access-control:read` - (default, for access control)
   - `iam.current-user:read` - (default, for user identity)
4. Click **Save**

> **Important**: User authorization is in **Public Preview**. A workspace admin may need to enable this feature for the workspace first.

---

## Step 6: Deploy the App

1. After configuring resources and source, click **Deploy**
2. Databricks will:
   - Clone your Git repo
   - Install dependencies from `requirements.txt`
   - Start the app using the `command` in `app.yaml`
3. Monitor deployment in the **Logs** tab

---

## Step 7: Grant User Access

1. Go to the app's **Permissions** tab
2. Add users or groups who should access the app
3. Set permission level:
   - **CAN USE**: For end users (can view and interact)
   - **CAN MANAGE**: For developers (can edit config and redeploy)

---

## Step 8: Verify

1. Once deployment shows **Running**, click the app URL
2. You should see the BharatBricks UI with the file list in the sidebar
3. Click any JSON file to see its schema and a sample record
4. If you see an auth error on file preview, ensure:
   - User authorization is enabled (Step 5)
   - The user has `USE` permission on the SQL warehouse
   - The user has `READ` permission on the volume

---

## Redeploying After Code Changes

1. Push your code changes to the configured Git branch
2. Go to the app in Databricks UI
3. Click **Deploy** to pull the latest code and redeploy

Alternatively, use the Databricks CLI:

```bash
databricks apps deploy bharatbricks \
  --source-code-path /Workspace/Users/<your-email>/apps/bharatbricks
```

---

## Environment Variables Reference

These are configured in `app.yaml` and resolved at runtime:

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABRICKS_WAREHOUSE_ID` | `valueFrom: sql-warehouse` | SQL warehouse ID (auto-resolved from resource) |
| `VOLUME_PATH` | `value` (static) | UC Volume path for JSON files |
| `CATALOG_NAME` | `value` (static) | Unity Catalog name |
| `SCHEMA_NAME` | `value` (static) | UC Schema name |
| `DATABRICKS_CLIENT_ID` | Auto-injected | App service principal OAuth client ID |
| `DATABRICKS_CLIENT_SECRET` | Auto-injected | App service principal OAuth secret |
| `DATABRICKS_HOST` | Auto-injected | Workspace URL |

---

## Auth Model Summary

| Operation | Auth Type | How It Works |
|-----------|-----------|--------------|
| List files in volume | **App auth** (SP) | `WorkspaceClient()` uses auto-injected SP credentials |
| Run SQL for file preview | **User auth** (OBO) | `x-forwarded-access-token` header passed to `sql.connect()` |

This dual-auth approach means:
- **File listing** works for all users via the app's service principal
- **SQL preview** runs under the user's identity, respecting Unity Catalog permissions and appearing in the user's query history

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| App shows "No JSON files found" | Check SP has `READ VOLUME` on the volume; verify `VOLUME_PATH` |
| "User authorization required" on preview | Enable user auth in app settings with `sql` scope |
| SQL query fails with permission error | Grant user `USE` on the SQL warehouse and `SELECT` on the volume |
| App deployment fails | Check **Logs** tab; ensure `requirements.txt` deps are installable |
| 502/503 errors | App is still starting — wait 30-60s; check logs for crash |
