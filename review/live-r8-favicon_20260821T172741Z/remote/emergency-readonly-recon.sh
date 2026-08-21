set +e
set +x
DEPLOY_ROOT="/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo"
printf 'CURRENT=%s\n' "$(readlink -f "$DEPLOY_ROOT/current" 2>/dev/null)"
printf 'STATIC_ACTIVE=%s\n' "$(systemctl is-active uiadapt-static.service 2>/dev/null)"
printf 'STATIC_ENABLED=%s\n' "$(systemctl is-enabled uiadapt-static.service 2>/dev/null)"
printf 'GATEWAY_ACTIVE=%s\n' "$(systemctl is-active uiadapt-gateway.service 2>/dev/null)"
printf 'GATEWAY_ENABLED=%s\n' "$(systemctl is-enabled uiadapt-gateway.service 2>/dev/null)"
printf 'STATIC_HTTP=%s\n' "$(curl --connect-timeout 2 --max-time 5 --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:5173/uiadapt_demo/ 2>/dev/null)"
printf 'GATEWAY_UNAUTH=%s\n' "$(curl --connect-timeout 2 --max-time 5 --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:4180/uiadapt_demo/ 2>/dev/null)"
printf '%s\n' 'STATIC_STATUS_BEGIN'
systemctl status uiadapt-static.service --no-pager -l
printf '%s\n' 'STATIC_STATUS_END'
printf '%s\n' 'GATEWAY_STATUS_BEGIN'
systemctl status uiadapt-gateway.service --no-pager -l
printf '%s\n' 'GATEWAY_STATUS_END'