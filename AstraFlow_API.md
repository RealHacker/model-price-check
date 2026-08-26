# 批量查询模型价格 - GetUFSquareModelPrices

## 简介

批量查询模型价格




## 使用方法

您可以选择以下方式中的任意一种，发起 API 请求：
- 多语言 OpenSDK / [Go](https://github.com/ucloud/ucloud-sdk-go) / [Java](https://github.com/ucloud/ucloud-sdk-java) / [Python](https://github.com/ucloud/ucloud-sdk-python3) / [JavaScript](https://github.com/ucloud/ucloud-sdk-js) / [PHP](https://github.com/ucloud/ucloud-sdk-php) /
- [CloudShell 云命令行](https://shell.ucloud.cn/)

## 定义

### 公共参数

| 参数名 | 类型 | 描述信息 | 必填 |
|:---|:---|:---|:---|
| **Action**     | string  | 对应的 API 指令名称，当前 API 为 `GetUFSquareModelPrices`                        | **Yes** |
| **PublicKey**  | string  | 用户公钥，可从 [控制台](https://console.ucloud.cn/uaccount/api_manage) 获取                                             | **Yes** |
| **Signature**  | string  | 根据公钥及 API 指令生成的用户签名，参见 [签名算法](https://docs.ucloud.cn/api/summary/signature)  | **Yes** |

### 请求参数

| 参数名 | 类型 | 描述信息 | 必填 |
|:---|:---|:---|:---|
| **Keyword** | string | 模型名称模糊搜索（例：deepseek-r1） |No|
| **Offset** | int | 列表起始位置偏移量，默认为0 |No|
| **Limit** | int | 返回数据长度，默认为20 |No|

### 响应字段

| 字段名 | 类型 | 描述信息 | 必填 |
|:---|:---|:---|:---|
| **RetCode** | int | 返回状态码，为 0 则为成功返回，非 0 为失败 |**Yes**|
| **Action** | string | 操作指令名称 |**Yes**|
| **Message** | string | 返回错误消息，当 `RetCode` 非 0 时提供详细的描述信息 |No|
| **Models** | array[[*ModelPriceGroup*](#modelpricegroup)] | 匹配模型的价格信息 |**Yes**|
| **TotalCount** | int | 总条数用于翻页 |No|

#### 数据模型

#### ModelPriceGroup

| 字段名 | 类型 | 描述信息 | 必填 |
|:---|:---|:---|:---|
| **Manufacturer** | string | 制造商 |**Yes**|
| **ModelName** | string | 模型名称 |No|
| **ModelId** | string | ModelId |No|
| **Tiers** | array[[*PriceTier*](#pricetier)] | 价格阶梯（有序数组） |No|

#### PriceTier

| 字段名 | 类型 | 描述信息 | 必填 |
|:---|:---|:---|:---|
| **Rates** | array[[*PriceRate*](#pricerate)] | 该档位下的收费列表（有序数组） |**Yes**|
| **DescriptionEn** | string | 档位描述（例如 "标准上下文 32k"） |**Yes**|
| **Condition** | string | 档位/条件（例如 "32k"、"128k"） |No|
| **Description** | string | 档位描述（例如 "标准上下文 32k"） |No|

#### PriceRate

| 字段名 | 类型 | 描述信息 | 必填 |
|:---|:---|:---|:---|
| **ChargeItemDescriptionEn** | string | 收费项描述英文描述 |**Yes**|
| **Currency** | string | 货币单位 |**Yes**|
| **Unit** | string | 计价单位 |**Yes**|
| **UnitEn** | string | 计价单位英文 |**Yes**|
| **ChargeItem** | string | 收费项：input/output/thinking/tool... |No|
| **ChargeItemDescription** | string | 收费项描述 |No|
| **Price** | string | 价格 |No|

## 示例

### 请求示例
```
https://api.ucloud.cn/?Action=GetUFSquareModelPrices
&Region=cn-zj
&Zone=cn-zj-01
&Keyword=tUpakpEx
&Offset=2
&Limit=2
```

### 响应示例
```json
{
  "Action": "GetUFSquareModelPricesResponse",
  "Models": [
    {
      "ModelId": "OimToelj",
      "ModelName": "vNbcKKTy",
      "Tiers": [
        {
          "Condition": "eNlQgdAu",
          "Description": "sVuQZmlZ",
          "Rates": [
            {
              "ChargeItem": "qoFeTVec",
              "ChargeItemDescription": "jydMPQin",
              "Price": "xgXpKJwx"
            }
          ]
        }
      ]
    }
  ],
  "RetCode": 0,
  "TotalCount": 4
}
```

# 签名算法

>! UCloud 提供了多种语言的 SDK，SDK 会自动为请求签名，请务必使用 SDK，无需自行计算，详情可见顶部**开发**导航。

## 数据假设

在生成 API 请求中的签名（`Signature`） 时，需要提供账户中密钥，包括 `PublicKey` 和 `PrivateKey`，
密钥可以从 [UAPI 控制台](https://console.ucloud.cn/uapi/apikey) 获取。

本例中假设

```
PublicKey  = 'ucloudsomeone@example.com1296235120854146120'
PrivateKey = '46f09bb9fab4f12dfc160dae12273d5332b5debe'
```

?> 你可以使用上述的 `PublicKey` 和 `PrivateKey` 调试你的代码， 当得到跟后面一致的签名结果后（即表示你的代码是正确的），可再换为你自己的 `PublicKey` 和 `PrivateKey` 以及其他 API 请求。

本例中假设用户请求参数串如下:

```json
{
    "Action"     :  "DescribeUHostInstance",
    "Region"     :  "cn-bj2",
    "Limit"      :  10,
    "PublicKey"  :  "ucloudsomeone@example.com1296235120854146120"
}
```

生成被签名串的 SHA1 签名，即是请求参数 `Signature` 的值。

按照上述算法，本例中，计算出的 `Signature` 为 **cba5cf5ec4d4233d206b1b54951e3787350a642f** 。

## 构造签名

### 1. 将请求参数按照名称进行升序排列

```json
{
    "Action"     :  "DescribeUHostInstance",
    "Limit"      :  10,
    "PublicKey"  :  "ucloudsomeone@example.com1296235120854146120",
    "Region"     :  "cn-bj2"
}
```

### 2. 构造被签名参数串

被签名串的构造规则为: 被签名串 = 所有请求参数拼接(无需 HTTP 转义)。并在本签名串的结尾拼接 API 密钥的私钥（`PrivateKey`）。

```
ActionDescribeUHostInstanceLimit10PublicKeyucloudsomeone@example.com1296235120854146120Regioncn-bj246f09bb9fab4f12dfc160dae12273d5332b5debe
```

注意：

- 对于 bool 类型，应编码为 `true/false`
- 对于浮点数类型，如果小数部分为 0，应仅保留整数部分，如 `42.0` 应保留 `42`
- 对于浮点数类型，不能使用科学计数法

### 3. 计算签名

使用 SHA1 编码被签名串，生成最终签名。
