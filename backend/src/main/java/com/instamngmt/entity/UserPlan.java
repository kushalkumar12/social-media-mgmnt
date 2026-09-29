package com.instamngmt.entity;

public enum UserPlan {
    SINGLE(1),
    LITE(10),
    PRO(40),
    MASTER(9999);

    private final int accountLimit;

    UserPlan(int accountLimit) {
        this.accountLimit = accountLimit;
    }

    public int getAccountLimit() {
        return accountLimit;
    }
}
