pipeline {
  agent any 

  stages {
    stage('checkout-scm') {
      steps {
         cleanWs()
         checkout scm  
         echo "checking out rthe code from last commit : ${env.GIT_COMMIT}"
      }
    }
  
  stage('gitleaks-secret-scan') {
    steps {
      sh '''
      gitleaks detect --source . --verbose --report-path=gitleaks-report.json
      '''
    }
    post {
      always {
        archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
      }
    }
  }
}
}