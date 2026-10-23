# Only Cryptids: Facebook and Instagram member publishing

Status: implemented behind provider-authorization readiness gates; **not yet live-verified or deployed**. Backend and frontend syntax/build checks passed on October 23, 2026.

## Three different Meta operations

1. **Sign into Cryptids using Facebook**: supported by Base44's `facebook` social-login provider only after enabling that provider in the Base44 Auth settings. This is not permission to publish to a Facebook Page.
2. **Post to a Facebook Page**: the logged-in Cryptids member must authorize a separate **app-user** Facebook Pages OAuth connector. Their Pages must be returned by `/me/accounts`, their Page tasks must permit content creation, and their provider grant must include Page publishing permissions. The member selects their own Page for each post.
3. **Publish to Instagram**: requires a member-owned Instagram **Business or Creator** account and its separate app-user Instagram OAuth grant. Instagram personal accounts can use the device-native picture sharing option, which does **not** claim automatic API publishing.

App-wide/shared Meta connections **cannot** be substituted for a member's own grant.

## Platform setup remaining (operator action)

* In the Base44 editor, enable Facebook social login for **Only Cryptids**. This setting was not changed by repository source edits; the available CLI requested interactive Base44 device authentication.
* Register the two separate *app-user OAuth connectors* in the Base44 workspace using properly configured Meta developer applications, redirect URIs, account access and approved scopes. These must be allowed for production users (Meta App Review/advanced access where applicable).
* Save their nonsecret connector registration IDs as secure Base44 environment configuration:
  * `CRYPTIDS_FACEBOOK_PAGES_APP_USER_CONNECTOR_ID`
  * `CRYPTIDS_INSTAGRAM_APP_USER_CONNECTOR_ID`
* Never store Meta access tokens, app secrets, user passwords or Page tokens in source code, client storage, Creator or SocialPublication entities. Base44's current-app-user connector supplies tokens server-side.

A separate application-owned connector can be authorized in the Base44 Integrations settings, but that alone is not a member account authorization. Do not mark user posting as supported based on shared-connector setup.

## User workflow after setup

1. Sign into Cryptids, open **Settings → Facebook & Instagram connections**.
2. Click **Connect** for the desired provider; complete provider-hosted consent and return.
3. Click **Check connections**. A verified account read is necessary; mere registration is not connected status.
4. Open one of your *own published posts*, then **Publish on a connected social account**.
5. Choose the exact Facebook Page, or provide a public HTTPS image URL for Instagram; confirm you own the media and click Publish.
6. A success message is shown **only** if the provider returns a confirmed external post ID. An ambiguous failure is recorded as `uncertain` and is not automatically sent again.

For personal Instagram accounts, select **Share picture to Instagram or another app** from the post's share options; Cryptids generates an image locally, then offers Android/iOS sharing or an image download.

## Validation to perform with real test accounts

* Sign up and sign in using enabled Facebook login, including denied consent and a user who signs up by email.
* Connect one test user's Page, verify Page-specific CREATE_CONTENT tasks, and publish a post. Confirm a new Facebook post on that specific Page.
* Connect a different user and verify that the first person's Page and token are never accessible.
* Connect an Instagram professional test account and publish to that account from a public HTTPS image.
* Test revoked grants, denied scopes, expired authorization, personal Instagram accounts, invalid URLs, failed posts, duplicate clicks and pending-media resume behavior.
* Verify app-publication deployment separately. A successful source build does not make the changes live.

## Security

The backend checks authenticated user ownership and published status before posting. Provider access tokens remain server-side. `SocialPublication` is service-role only and tracks one user/post/platform/destination publication attempt to prevent mistaken duplicate retries.

This implementation does **not** provide Instagram personal-account login to Cryptids: Instagram Login in this integration is account authorization for professional publishing, not a general-purpose Base44 sign-in provider.
