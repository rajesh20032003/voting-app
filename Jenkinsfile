pipeline {
  agent any 
  environment {
    REGISTRY = 'rajesh00007'
  }
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
  stage('trivy fs scan') {
    steps {
      sh """
      trivy fs --scanners vuln,secret,misconfig .
      """
    }
  }
  stage('npm ci') {
    agent {
      docker { 
        image 'node:24.17.0-alpine3.24'
        args '-v $HOME/.npm:/root/.npm'
        }

    }
    steps {
      dir('backend') {
        sh '''
        npm ci --no-audit 
      
        '''
      }
    }
  }
  stage('image building'){
    parallel {
      stage('frontend-building') {
        steps {
          dir(frontend) {
            sh '''
            docker build -t ${env.REGISTRY}/${env.GIT_COMMIT}-${frontend}-${env.BUILD_NUMBER} .
            '''
          }
        }
      }
      stage('backend-building') {
        steps {
          dir(backend) {
            sh '''
            docker build -t ${env.REGISTRY}/${env.GIT_COMMIT}-${backend}-${env.BUILD_NUMBER} . 
            '''
          }
        }
      }
    }
  }
}
}