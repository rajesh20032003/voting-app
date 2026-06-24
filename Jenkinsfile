pipeline {
  agent any 

  stages {
    stage('checkout-scm') {
      steps {
         chekout scm  
         echo "checking out the code from last commit : ${env.GIT_COMMIT}"
      }
    }
  }
}