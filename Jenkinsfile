pipeline {
  agent any 

  stages {
    stage('checkout-scm') {
      steps {
         cleanWs()
         chekout scm  
         echo "checking out the code from last commit : ${env.GIT_COMMIT}"
      }
    }
  
  stage('gitleaks-secret-scan') {
    agent {
      docker {
        image 'zricethezav/gitleaks:latest'
        args '-u root'
      }
    }
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