#include<bits/stdc++.h>
using namespace std;

void printArray(int arr[], int n) {
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
}

void zeroToEnd(int arr[], int n) {
    if(n <= 1){
        return printArray(arr, n);
    }

    int i = 0,j = 1;
    while(j<n){
        if(arr[i] != 0){
            i++;
            j++;
        }else{
            if(arr[j] != 0){
                swap(arr[i],arr[j]);
                i++;
            }
            j++;
        }
    }
    return printArray(arr, n);
    
}

int main(){
    int arr = {0, 2, 1, 0, 5};

    int n = sizeof(arr) / sizeof(arr[0]);
    zeroToEnd(arr, n);

    return 0;
}