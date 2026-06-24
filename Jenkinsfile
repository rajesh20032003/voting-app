pipeline {
  agent any 
  parameters {
    string(name: 'IMAGE_TAG', defaultValue: "${env.BUILD_NUMBER}", description: ' docker image tag ')
  }

  environment {
    IMAGE_NAME = "voting-app"
    USER_NAME = "rajesh00007"
    REGISTRY = "docker.io"
  }

  stages{
      stage('checkout') {
        steps {
          checkout scm 
          echo "branch: ${env.GIT_BRANCH}"
          echo "commit: ${env.GIT_COMMIT}"
          echo "checked out the code from the repo"
        }
      }
      stage('gitleaks') {
        steps {
          script {
            sh """
            docker run --rm \
          -v \${WORKSPACE}:/repo \
          -e GITLEAKS_LOG_OPTS="--all" \
          zricethezav/gitleaks:latest \
          detect --source /repo \
          --no-git \
          --report-format json \
          --report-path /repo/gitleaks-report.json \
          -v || true
            """
          archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
          }
        }
      }
  }
}