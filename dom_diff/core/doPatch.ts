import { render, setAttrs } from "./virtualDom";
import { Element } from "./Element";
import { PatchItem, PATHCH_TYPE } from "../types";

//存放补丁包
let finalPatches = {},
    rNodeIndex = 0;//真实节点的编号

//为真实dom打补丁
function doPatch(rDom: HTMLElement | Text, patches: object) {
    finalPatches = patches;
    //遍历真实节点
    rNodeWalk(rDom);
}

//遍历真实节点
function rNodeWalk(rNode: HTMLElement | Text) {
    //取出当前节点的补丁和当前节点的子节点
    const rNodePatch = finalPatches[rNodeIndex++],
        childNodes = rNode.childNodes;

    //递归处理当前节点的子节点
    [...childNodes].map(child => {
        rNodeWalk(child as HTMLElement | Text);
    })

    if(rNodePatch){
        //如果当前节点存在对应的补丁, 为当前节点进行打补丁的操作
        doPatchAction(rNode, rNodePatch);
    }
}

//为存在补丁的真实节点打补丁
function doPatchAction(rNode: HTMLElement | Text, rNodePatch: Array<PatchItem>) {
    rNodePatch.map(patch => {
        //根据补丁的类型，进一步处理
        switch(patch.type) {
            //节点属性需要打补丁
            case PATHCH_TYPE.ATTR:
                for(let key in patch.attrs) {
                    //遍历补丁包中的attrs对象
                    const value = patch.attrs[key];
                    if(value){
                        //如果属性值存在，则更新真实dom中的对应属性值
                        setAttrs(rNode as HTMLElement, key, value);
                    }else{
                        //属性不存在则移除该属性
                        (rNode as HTMLElement).removeAttribute(key);
                    }
                }
                break;
            //更新节点文本值
            case PATHCH_TYPE.TEXT:
                rNode.textContent = patch.text as string;
                break;
            //替换为新节点
            case PATHCH_TYPE.REPLACE:
                const newNode = (patch.newNode instanceof Element)
                                ?
                                render(patch.newNode)//先将虚拟节点渲染成真实节点再替换旧的真实节点
                                :
                                document.createTextNode(patch.newNode as string); //新节点为文本节点

                //替换旧的真实节点
                (rNode.parentNode as HTMLElement | Text).replaceChild(newNode, rNode);
                break;
            //删除旧的真实节点
            case PATHCH_TYPE.REMOVE:
                (rNode.parentNode as HTMLElement).removeChild(rNode);
                break;
            default:
                break;
        }

    })
}

export { doPatch };