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
    script
      sh "echo '[]' > gitleaks-report.json"

      // debug — see what's in workspace
      sh "ls -la \${WORKSPACE}"
      sh "ls -la \${WORKSPACE}/backend"

      // check if docker can see the files
      sh """
        docker run --rm \
          -v \${WORKSPACE}:/repo \
          zricethezav/gitleaks:latest \
          sh -c "ls -la /repo"
      """

      sh """
        docker run --rm \
          -v \${WORKSPACE}:/repo \
          zricethezav/gitleaks:latest \
          detect \
          --source /repo \
          --no-git \
          --report-format json \
          --report-path /repo/gitleaks-report.json \
          -v
      """
    }
  }
  post {
    always { archiveArtifacts artifacts: 'gitleaks-report.json' }
    failure { echo '❌ Secrets found!' }
    success { echo '✅ No secrets found!' }
  }
}
  }
