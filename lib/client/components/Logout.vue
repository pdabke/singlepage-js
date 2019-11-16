<template>
  <div class="sp-full-page sp-center-content">
			<div class="sp-centered-content-with-footer">
					<div style="text-align: center;">
						<img src="/sp-files/images/app_logo.png" />
						<div class="text-primary" style="margin-top: 20px; max-width: 300px;">{{$i18n('msg_logout_message')}}</div>
						<div class="m-4"><button id="login-button" class="btn btn-primary" @click.prevent="$app.showLoginPage()">{{$i18n('msg_login')}}</button></div>
					</div>
			</div>
			<div class="footer small text-center d-flex align-items-center justify-content-center">&copy; My Company. All rights reserved.</div>
	</div>
  
</template>
