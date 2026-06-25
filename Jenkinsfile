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
  // stage('npm ci') {
  //   agent {
  //     docker { 
  //       image 'node:24.17.0-alpine3.24'
  //       args '-v $HOME/.npm:/root/.npm'
  //       }

  //   }
  //   steps {
  //     dir('backend') {
  //       sh '''
  //       // npm ci --no-audit 
  //       echo "backend"
      
  //       '''
  //     }
  //   }
  // }
  stage('image building'){
    parallel {
      stage('frontend-building') {
        steps {
          dir('frontend') {
            withCredentials([usernamePassword(
             credentialsId: 'dockerhub-creds',
             usernameVariable: 'DOCKER_USER',
             passwordVariable: 'DOCKER_PASS'
            )]){
           sh '''
           BUILDER=frontend-${BUILD_NUMBER}
           SERVICE=frontend

           echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
           docker buildx create --name "$BUILDER" --driver docker-container --use

           docker buildx build \
           --builder "$BUILDER" \
           --platform linux/amd64 \
           --tag ${REGISTRY}/$SERVICE:${BUILD_NUMBER} \
           --cache-to type=registry,ref=$REGISTRY/$SERVICE:CACHE,mode=max \
           --cache-from type-registry,ref=$REGISTRY/$SERVICE:CACHE
           --push \
           .

          docker buildx rm "$BUILDER"
          
            '''
            }
          }
        }
      }
      stage('backend-building') {
        steps {
          dir('backend') {
            withCredentials([usernamePassword(
             credentialsId: 'dockerhub-creds',
             usernameVariable: 'DOCKER_USER',
             passwordVariable: 'DOCKER_PASS'
            )]){
           sh '''
           BUILDER=backend-${BUILD_NUMBER}
           SERVICE=backend
           
           echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
           docker buildx create --name "$BUILDER" --driver docker-container --use

           docker buildx build \
           --builder "$BUILDER" \
           --platform linux/amd64 \
           --cache-to type=registry,ref=$REGISTRY/$SERVICE:CACHE,mode=max \
           --cache-from type-registry,ref=$REGISTRY/$SERVICE:CACHE
           --push \
           .

          docker buildx rm "$BUILDER"
          
            '''
            }
          }
        }
      }
    }
  }
}
}