USER_NAME="rbac-creator"
USER_NAMESPACE="default"
CLUSTER_NAME=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')
CLUSTER_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
CLUSTER_CA=$(kubectl config view --raw --minify -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')
USER_TOKEN=$(kubectl create token $USER_NAME -n $USER_NAMESPACE)

cat <<EOF > ${USER_NAME}-kubeconfig.yaml
apiVersion: v1
kind: Config
clusters:
- name: ${CLUSTER_NAME}
  cluster:
    certificate-authority-data: ${CLUSTER_CA}
    server: ${CLUSTER_SERVER}
contexts:
- name: ${USER_NAME}@${CLUSTER_NAME}
  context:
    cluster: ${CLUSTER_NAME}
    namespace: ${USER_NAMESPACE}
    user: ${USER_NAME}
current-context: ${USER_NAME}@${CLUSTER_NAME}
users:
- name: ${USER_NAME}
  user:
    token: ${USER_TOKEN}
EOF

echo "✅ Kubeconfig written to ${USER_NAME}-kubeconfig.yaml"

