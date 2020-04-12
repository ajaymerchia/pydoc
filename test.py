def fn_with_ret() -> int:
    i = 0
    p = 2
    return i + p

def fn_with_params(var1: str, var2: Optional[int]) -> None:
    var2 *= 2
    var1 += var1
    print([var1, var2, var1 + var2])

def fn_with_params(var1: str="hello, world", var2: double = 0.567) -> None:
    var2 *= 2
    var1 += var1
    print([var1, var2, var1 + var2])

def fn_with_params_and_ret(var1: str, var2: int) -> list:
    var2 *= 2
    var1 += var1

    return [var1, var2, var1 + var2]

def fn_with_params_ridiculous(var1: dict={'hel\"l{o': ('wo\"rl}d', '4', 3)}, var2: double = 0.567) -> double:
    return var1["he\"ll{o"][2] + var2

def bad_formatted_fn(var2, var3):
    print('oops')
    print("I forgot both type specifications")
    pass

def bad_formatted_fn(var2: str, var3: int):
    print('oops')
    print("I forgot type specifications for return type")
    pass

def bad_formatted_fn(var2: str, var3) -> None:
    print('oops')
    print("I forgot type specifications for params")
    pass
