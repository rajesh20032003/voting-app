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

  stage('npm ci') {
    agent {
      docker { image 'node:24.17.0-alpine3.24'
                  args '-v $HOME/.npm:/root/.npm'}

    }
    steps {
      dir('backend') {
        sh '''
        npm ci --no-audit 
        npm test
        '''
      }
    }
  }
}
}